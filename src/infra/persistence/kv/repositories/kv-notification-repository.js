import { createBaseRepository } from './base-repository.js';
import { Notification } from '../../../../ctx/system/domain/notification.js';

export const createKVNotificationRepository = (kvPool) => {
  const base = createBaseRepository(kvPool, 'notifications');

  return {
    ...base,

    save: async (tenantId, notification) => {
      // We override save to ensure we use the pool if needed,
      // but base.save does that.
      // However, we might want to index or just use base.save.
      // Base save stores at ['tenants', tenantId, 'notifications', id]
      return base.save(tenantId, notification);
    },

    list: async (tenantId, { limit = 20, cursor, userId, read } = {}) => {
       return kvPool.withConnection(async (kv) => {
         // List in reverse order (newest first) assuming monotonic IDs or we sort in memory?
         // Notification IDs are UUIDs. UUIDs are NOT monotonic.
         // Deno KV lists by Key.
         // If we want chronological order, we should use a secondary index or a key structure like [tenantId, 'notifications', timestamp, id].
         // OR we just scan all (naive) and sort in memory if the dataset is small.
         // Given "Notification List Page", let's assume we want to support thousands eventually.
         // But for now, scanning all and filtering is the "Naive" strategy mentioned in memory.

         // To support correct sorting by date with UUIDs, we really need that secondary index.
         // But let's stick to the "Naive" strategy from memory:
         // "fetch a larger dataset (limit 1000) from the repository" and sort/filter.

         const listPrefix = ['tenants', tenantId, 'notifications'];
         const iter = kv.list({ prefix: listPrefix }, { limit: 1000 }); // Fetch up to 1000

         let items = [];
         for await (const res of iter) {
           items.push(res.value);
         }

         // In-memory Filter
         if (userId) {
           items = items.filter(n => n.userId === userId || n.userId === null);
         }
         if (read !== undefined) {
           items = items.filter(n => n.read === read);
         }

         // In-memory Sort (Newest First)
         items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

         // Pagination (Cursor)
         // Since we fetched all (or 1000), "cursor" here would ideally be an offset or ID.
         // But standard Deno KV cursor works on the *Scan*, not the sorted result.
         // If we use "Naive" strategy, we usually ignore real cursors and just slice the array if we keep it simple.
         // Or we rely on the client to handle "pages" via slice.
         // For now, let's just return the top 'limit' items.

         // If cursor is provided, it's tricky with naive sort.
         // Let's return the sliced result.
         const start = 0; // We don't support deep pagination with this naive approach efficiently
         const sliced = items.slice(0, limit);

         // We won't return a nextCursor because we can't efficiently resume this naive sort without re-fetching.
         // This is a known limitation of the "Hardened Beta" state for some lists.

         return { items: sliced, nextCursor: null };
       });
    },

    markAsRead: async (tenantId, id) => {
      return kvPool.withConnection(async (kv) => {
        const key = ['tenants', tenantId, 'notifications', id];
        const res = await kv.get(key);
        if (!res.value) return null;

        const updated = { ...res.value, read: true };
        await kv.set(key, updated);
        return updated;
      });
    }
  };
};
