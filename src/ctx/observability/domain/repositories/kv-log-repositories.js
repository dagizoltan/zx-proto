import { createBaseRepository } from '../../../../infra/persistence/kv/repositories/base-repository.js';

export const createKVLogRepository = (kvPool) => {
    // Base repository isn't perfectly suited for time-series logs with composite keys,
    // so we will implement specific list methods but leverage base if needed.
    // However, since logs don't have IDs in the traditional sense, we'll implement custom logic.

    const list = async (tenantId, { level, limit = 50, cursor } = {}) => {
        return kvPool.withConnection(async (kv) => {
            const selector = {
                prefix: ['tenants', tenantId, 'logs', level.toLowerCase()]
            };

            const options = {
                limit,
                reverse: true, // Newest first
            };

            if (cursor) {
                options.cursor = cursor;
            }

            const iter = kv.list(selector, options);
            const items = [];
            for await (const res of iter) {
                items.push(res.value);
            }

            return {
                items,
                nextCursor: items.length === limit ? iter.cursor : null
            };
        });
    };

    return { list };
};

export const createKVActivityRepository = (kvPool) => {
    // Reuses the log structure but specifically for ACTIVITY level
    const repo = createKVLogRepository(kvPool);

    return {
        list: (tenantId, params) => repo.list(tenantId, { ...params, level: 'activity' })
    };
};

export const createKVAuditRepository = (kvPool) => {
    // Reuses the log structure but specifically for AUDIT level
    // Note: We are replacing the old System Audit Repo which stored full objects
    // with this one that reads from the OBS log stream.
    const repo = createKVLogRepository(kvPool);

    return {
        list: (tenantId, params) => repo.list(tenantId, { ...params, level: 'audit' }),
        // Keep save for backward compatibility if SystemEventsListener still uses it,
        // although obs now handles writing.
        // If SystemEventsListener writes to this repo, we should map it to the OBS format or just rely on OBS.
        // For now, let's assume we read from OBS logs.
    };
};
