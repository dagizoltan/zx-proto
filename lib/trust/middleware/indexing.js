import { Ok } from '../result.js';

/**
 * Indexing Middleware
 * Handles maintenance of secondary indexes defined in the schema configuration.
 *
 * @param {Object} indexes - Map of index names to key generators
 * Example: { 'by_sku': (doc) => doc.sku, 'by_status': (doc) => doc.status }
 */
export const useIndexing = (indexes = {}) => {
    return {
        name: 'indexing',
        indexes, // Expose indexes to repository

        // We need access to the Atomic operation to buffer index writes
        // The core 'save' needs to expose the atomic op or allow middleware to append to it.
        // Implementation Strategy:
        // Middleware returns { atomicOps: [(atomic) => atomic.set(...)] }?
        // OR Core passes atomic into beforeSave?
        // Let's assume Core passes a mutable `transaction` object which wraps the atomic chain.

        beforeSave: async (ctx, data, { existing, atomic }) => {
            const { tenantId, schemaName } = ctx;

            for (const [indexName, keyFn] of Object.entries(indexes)) {
                // 1. Calculate new index key
                const newVal = keyFn(data);

                // 2. Calculate old index key (if update)
                const oldVal = existing ? keyFn(existing) : undefined;

                // 3. If changed, delete old
                if (existing && oldVal !== undefined && oldVal !== newVal) {
                    // Handle arrays for multi-value indexes (e.g. tags)
                    const oldKeys = Array.isArray(oldVal) ? oldVal : [oldVal];
                    for (const k of oldKeys) {
                        if (k) atomic.delete(['tenants', tenantId, `idx_${schemaName}_${indexName}`, k, data.id]);
                    }
                }

                // 4. Set new
                if (newVal !== undefined && newVal !== null) {
                    const newKeys = Array.isArray(newVal) ? newVal : [newVal];
                    for (const k of newKeys) {
                        if (k) atomic.set(['tenants', tenantId, `idx_${schemaName}_${indexName}`, k, data.id], data.id);
                    }
                }
            }
            return Ok(data);
        },

        beforeDelete: async (ctx, id, { existing, atomic }) => {
             const { tenantId, schemaName } = ctx;
             if (!existing) return Ok(id);

             for (const [indexName, keyFn] of Object.entries(indexes)) {
                 const val = keyFn(existing);
                 if (val !== undefined && val !== null) {
                     const keys = Array.isArray(val) ? val : [val];
                     for (const k of keys) {
                         if (k) atomic.delete(['tenants', tenantId, `idx_${schemaName}_${indexName}`, k, id]);
                     }
                 }
             }
             return Ok(id);
        }
    };
};
