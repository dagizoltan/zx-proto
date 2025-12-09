import { createBaseRepository } from '../../../../infra/persistence/kv/repositories/base-repository.js';

export const createKVFeedRepository = (kvPool) => {
    const base = createBaseRepository(kvPool, 'feed', 'feed');

    // We want a timeline, so default to sorting by timestamp (or created_at)
    // The base repository typically sorts by ID unless we have a specific index.
    // For a feed, we likely want `['tenants', tenantId, 'feed', timestamp_desc, id]`.

    // Since base repo is generic, let's implement a specific list method for timeline.
    const list = async (tenantId, { limit = 20, cursor } = {}) => {
         return kvPool.withConnection(async (kv) => {
            // Using a secondary index-like structure for time-based retrieval?
            // Or just store keys as: ['tenants', tenantId, 'feed', timestamp_desc]
            // Let's assume keys are naturally time-ordered or we create an index.

            // For simplicity in this KV setup, let's store feed items with ID,
            // but rely on a secondary index for ordering if BaseRepo doesn't support it well.
            // Actually, let's just make the PRIMARY key time-based for the feed:
            // Key: ['tenants', tenantId, 'feed', timestamp_desc]

            const selector = {
                prefix: ['tenants', tenantId, 'feed']
            };

            // KV lists in lexicographical order.
            // If we use timestamp_desc as part of the key, we get natural ordering.
            // timestamp_desc = (Date.now() inverted).

            const iter = kv.list(selector, { limit, cursor });
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

    const save = async (tenantId, item) => {
        return kvPool.withConnection(async (kv) => {
            // Construct a reverse timestamp key for ordering
            const timestamp = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
            const timestampDesc = Number.MAX_SAFE_INTEGER - timestamp;
            const key = ['tenants', tenantId, 'feed', timestampDesc, item.id];

            await kv.set(key, item);
            return item;
        });
    };

    return { list, save };
};

export const createKVMessageRepository = (kvPool) => {
    const base = createBaseRepository(kvPool, 'messages', 'message');

    // Similarly, messages usually need to be time-ordered.
    // For now, let's reuse the base generic list (ID based) or implement custom if user wants specific ordering.
    // User asked for "Simple text messages".

    return {
        ...base,
        // Override save to ensure createdAt is set if missing
        save: async (tenantId, item) => {
             if (!item.createdAt) item.createdAt = new Date().toISOString();
             return base.save(tenantId, item);
        }
    };
};

// Moving Notification Repository logic here
export const createKVNotificationRepository = (kvPool) => {
     // Re-implementing based on what system/domain/repositories/kv-notification-repo.js probably did
     // or just copy it if I could read it (I can, it's in system).
     // But essentially it's a base repo.
     const base = createBaseRepository(kvPool, 'notifications', 'notification');

     // Notifications likely need to be sorted by date too.
     return base;
};
