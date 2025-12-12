import { Ok, Err, isErr, unwrap } from './result.js';

export const createRepository = (kvPool, schemaName, plugins = []) => {

    const availableIndexes = plugins.reduce((acc, p) => {
        if (p.name === 'indexing' && p.indexes) {
            return { ...acc, ...p.indexes };
        }
        return acc;
    }, {});

    const runHook = async (hookName, ctx, initialData, extras = {}) => {
        let current = initialData;
        for (const plugin of plugins) {
            if (plugin[hookName]) {
                const result = await plugin[hookName](ctx, current, extras);
                if (isErr(result)) return result;
                current = result.value;
            }
        }
        return Ok(current);
    };

    const commitWithRetry = async (atomic) => {
        const MAX_RETRIES = 5;
        let attempt = 0;
        while (attempt < MAX_RETRIES) {
            attempt++;
            try {
                const res = await atomic.commit();
                return Ok(res);
            } catch (e) {
                if (e.message && (e.message.includes('database is locked') || e.name === 'TypeError')) {
                    const delay = Math.random() * 50 * attempt;
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                return Err({ code: 'COMMIT_ERROR', message: e.message });
            }
        }
        return Err({ code: 'TIMEOUT', message: 'Database locked after retries' });
    };

    const save = async (tenantId, data, { version = null, atomic: externalAtomic } = {}) => {
        return kvPool.withConnection(async (kv) => {
            const ctx = { tenantId, schemaName, action: 'save' };
            const key = ['tenants', tenantId, schemaName, data.id];

            const existingRes = await kv.get(key);
            const existing = existingRes.value;

            const expectedVersion = version || data._versionstamp;

            if (expectedVersion && existingRes.versionstamp !== expectedVersion) {
                return Err({ code: 'CONFLICT', message: 'Version mismatch' });
            }

            const atomic = externalAtomic || kv.atomic();
            atomic.check(existingRes);

            const { _versionstamp, ...cleanData } = data;

            const processedRes = await runHook('beforeSave', ctx, cleanData, { existing, atomic });
            if (isErr(processedRes)) return processedRes;

            const toSave = processedRes.value;

            atomic.set(key, toSave);

            if (externalAtomic) return Ok(cleanData);

            const commitRes = await commitWithRetry(atomic);
            if (!commitRes.ok) return commitRes; // Bubbles TIMEOUT or COMMIT_ERROR

            const commitValue = commitRes.value;
            if (!commitValue.ok) {
                return Err({ code: 'COMMIT_FAILED', message: 'KV commit failed (conflict)' });
            }

            return Ok({ ...cleanData, _versionstamp: commitValue.versionstamp });
        });
    };

    const findById = async (tenantId, id) => {
        return kvPool.withConnection(async (kv) => {
            const ctx = { tenantId, schemaName, action: 'find' };
            const key = ['tenants', tenantId, schemaName, id];
            const res = await kv.get(key);
            if (!res.value) return Err({ code: 'NOT_FOUND', message: `Entity ${id} not found` });

            const processedRes = await runHook('afterRead', ctx, res.value);
            if (isErr(processedRes)) return processedRes;

            return Ok({ ...processedRes.value, _versionstamp: res.versionstamp });
        });
    };

    const findByIds = async (tenantId, ids) => {
         return kvPool.withConnection(async (kv) => {
            const ctx = { tenantId, schemaName, action: 'find' };
            const chunks = [];
            for (let i = 0; i < ids.length; i += 10) {
                chunks.push(ids.slice(i, i + 10));
            }
            const results = [];
            for (const chunk of chunks) {
                const keys = chunk.map(id => ['tenants', tenantId, schemaName, id]);
                const batchRes = await kv.getMany(keys);
                for (const res of batchRes) {
                    if (res.value) {
                         const processed = await runHook('afterRead', ctx, res.value);
                         if (!isErr(processed)) results.push({ ...processed.value, _versionstamp: res.versionstamp });
                    }
                }
            }
            return Ok(results);
         });
    };

    const deleteFn = async (tenantId, id, { atomic: externalAtomic } = {}) => {
        return kvPool.withConnection(async (kv) => {
             const ctx = { tenantId, schemaName, action: 'delete' };
             const key = ['tenants', tenantId, schemaName, id];

             const existingRes = await kv.get(key);
             if (!existingRes.value) return Ok(false);

             const atomic = externalAtomic || kv.atomic();

             const hookRes = await runHook('beforeDelete', ctx, id, { existing: existingRes.value, atomic });
             if (isErr(hookRes)) return hookRes;

             atomic.delete(key);

             if (externalAtomic) return Ok(true);

             const commitRes = await commitWithRetry(atomic);
             if (!commitRes.ok) return commitRes;

             return Ok(true);
        });
    };

    const list = async (tenantId, { limit = 10, cursor, where = {} } = {}) => {
        return kvPool.withConnection(async (kv) => {
             const ctx = { tenantId, schemaName, action: 'list' };
             const prefix = ['tenants', tenantId, schemaName];
             const iter = kv.list({ prefix }, { limit, cursor });
             const items = [];
             let nextCursor = null;

             for await (const entry of iter) {
                 const rawValue = entry.value;
                 const processed = await runHook('afterRead', ctx, rawValue);
                 if (isErr(processed)) continue;
                 const item = processed.value;

                 let match = true;
                 for (const [k, v] of Object.entries(where)) {
                     if (item[k] !== v) {
                         match = false;
                         break;
                     }
                 }

                 if (match) {
                     items.push({ ...item, _versionstamp: entry.versionstamp });
                 }
             }
             return Ok({ items, nextCursor: iter.cursor });
        });
    };

    const queryByIndex = async (tenantId, indexName, value, { limit = 10, cursor } = {}) => {
        return kvPool.withConnection(async (kv) => {
            const prefix = ['tenants', tenantId, `idx_${schemaName}_${indexName}`, value];
            const iter = kv.list({ prefix }, { limit, cursor });
            const keys = [];
            for await (const res of iter) {
                keys.push(['tenants', tenantId, schemaName, res.value]);
            }
            if (keys.length === 0) return Ok({ items: [], nextCursor: null });

            const batchRes = await kv.getMany(keys);
            const items = [];
            for (const res of batchRes) {
                if (res.value) {
                     const processed = await runHook('afterRead', { tenantId, schemaName }, res.value);
                     if (!isErr(processed)) items.push({ ...processed.value, _versionstamp: res.versionstamp });
                }
            }
            return Ok({ items, nextCursor: iter.cursor });
        });
    };

    // Unified Query Layer
    const query = async (tenantId, { filter = {}, limit = 20, cursor, populate = [], searchFields = ['name', 'sku', 'description'] } = {}, context = {}) => {
        // 1. Determine Strategy
        // Find if any filter key matches an available index
        const indexMatch = Object.keys(filter).find(key => availableIndexes[key]);
        const resolvers = context.resolvers || {};

        const BATCH_SIZE = 1000; // Scan batch size for filtering

        // Check if we have additional filters beyond the index match
        const filterKeys = Object.keys(filter).filter(k => k !== indexMatch);
        const hasMemoryFilters = filterKeys.length > 0;

        // If no memory filters, we can just use the requested limit directly
        const fetchLimit = hasMemoryFilters ? BATCH_SIZE : limit;

        let result;

        if (indexMatch && filter[indexMatch] !== undefined) {
             // Use Index Strategy
             result = await queryByIndex(tenantId, indexMatch, filter[indexMatch], { limit: fetchLimit, cursor });
        } else {
             // Use Scan Strategy
             result = await list(tenantId, { limit: fetchLimit, cursor });
        }

        if (isErr(result)) return result;

        let { items, nextCursor } = result.value;

        // 2. Apply Remaining Filters (In-Memory)
        if (hasMemoryFilters) {
             items = items.filter(item => {
                 for (const key of filterKeys) {
                     const val = filter[key];
                     if (val === undefined) continue;

                     if (key.endsWith('_min')) {
                         const field = key.replace('_min', '');
                         if (item[field] < val) return false;
                     } else if (key.endsWith('_max')) {
                         const field = key.replace('_max', '');
                         if (item[field] > val) return false;
                     } else if (key.endsWith('_contains')) {
                         const field = key.replace('_contains', '');
                         if (!item[field]?.toLowerCase().includes(val.toLowerCase())) return false;
                     } else if (key === 'search') {
                          const lowerQ = val.toLowerCase();
                          // Generic Search across configured searchFields
                          let match = false;
                          for (const field of searchFields) {
                              if (item[field]?.toLowerCase().includes(lowerQ)) {
                                  match = true;
                                  break;
                              }
                          }
                          if (!match) return false;
                     } else {
                         // Exact match
                         if (item[key] !== val) return false;
                     }
                 }
                 return true;
             });
        }

        // 3. Slice to Limit?
        // NO. If we applied memory filters, we return the filtered batch as-is to preserve cursor continuity (from BATCH_SIZE).
        // If we did NOT apply memory filters, KV already limited it to 'limit' (via fetchLimit).
        // So 'items' is already correct size (or less).

        // 4. Populate
        if (populate.length > 0) {
            for (const popField of populate) {
                const resolver = resolvers[popField];
                if (!resolver) continue;

                // Gather IDs
                const idsToFetch = new Set();

                for (const item of items) {
                    const id = item[popField + 'Id'] ?? item[popField];
                    if (id) idsToFetch.add(id);
                }

                if (idsToFetch.size > 0) {
                    const fetchedRes = await resolver(Array.from(idsToFetch));
                    if (!isErr(fetchedRes)) {
                        const fetchedMap = new Map(fetchedRes.value.map(i => [i.id, i]));
                        // Assign back
                        for (const item of items) {
                            const id = item[popField + 'Id'] ?? item[popField];
                            if (id && fetchedMap.has(id)) {
                                item[popField] = fetchedMap.get(id); // Assign object to field
                            }
                        }
                    }
                }
            }
        }

        return Ok({
            items,
            nextCursor: nextCursor
        });
    };

    return {
        save,
        findById,
        findByIds,
        delete: deleteFn,
        list,
        queryByIndex,
        query
    };
};
