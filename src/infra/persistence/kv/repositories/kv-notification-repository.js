import { createBaseRepository } from './base-repository.js';
import { Notification } from '../../../../ctx/system/domain/notification.js';

export const createKVNotificationRepository = (kvPool) => {
  const base = createBaseRepository(kvPool, 'notifications');

  return {
    ...base,

    save: async (tenantId, notification) => {
      return kvPool.withConnection(async (kv) => {
          const key = ['tenants', tenantId, 'notifications', notification.id];
          // Fix: Deno KV cannot store functions (notification.toJSON is a method).
          // We must serialize it if it's an entity with methods, or ensure we pass data only.
          const data = typeof notification.toJSON === 'function' ? notification.toJSON() : notification;
          await kv.set(key, data);
          return data;
      });
    },

    list: async (tenantId, { limit = 20, cursor, userId, read } = {}) => {
       // Override base.findAll because we need complex in-memory filtering that base doesn't fully expose yet
       // or we use base.findAll and filter results.
       // Base repo returns { items, nextCursor }.
       // But base repo's findAll doesn't accept a filter callback in the arguments I saw earlier.
       // Let's implement it manually using withConnection to be safe and efficient.

       return kvPool.withConnection(async (kv) => {
           const iter = kv.list({ prefix: ['tenants', tenantId, 'notifications'] });
           const items = [];
           // Naive implementation: fetch all, sort, filter, slice.
           // Warning: Performance risk if thousands of notifications.
           // Future optimization: Secondary indexes.

           for await (const res of iter) {
               const item = res.value;
               if (userId && item.userId !== userId && item.userId !== null) continue;
               if (read !== undefined && item.read !== read) continue;
               items.push(item);
           }

           // Sort Descending
           items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

           // Slice (Naive pagination)
           // If we use cursor, we can't sort easily in memory after fetch.
           // For now, return top N.
           const sliced = items.slice(0, limit);
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
