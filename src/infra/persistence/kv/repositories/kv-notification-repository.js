import { createBaseRepository } from './base-repository.js';
import { Notification } from '../../../../ctx/system/domain/notification.js';

export const createKVNotificationRepository = (kv) => {
  const base = createBaseRepository(kv, 'notifications');

  return {
    ...base,

    save: async (tenantId, notification) => {
      const key = ['tenants', tenantId, 'notifications', notification.id];
      // Secondary index for User + Unread?
      // For now, simple list.
      await kv.set(key, notification);
      return notification;
    },

    list: async (tenantId, { limit = 20, cursor, userId, read } = {}) => {
       // Using the base list, but we might need filtering.
       // Base list iterates all.
       // For notifications, we probably want "My Notifications"
       // We can filter in memory for now as per "Naive" strategy in memory.

       return base.list(tenantId, {
         limit,
         cursor,
         filter: (item) => {
           if (userId && item.userId !== userId && item.userId !== null) return false;
           if (read !== undefined && item.read !== read) return false;
           return true;
         },
         // Sort by createdAt desc
         sort: (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
       });
    },

    markAsRead: async (tenantId, id) => {
      const key = ['tenants', tenantId, 'notifications', id];
      const res = await kv.get(key);
      if (!res.value) return null;

      const updated = { ...res.value, read: true };
      await kv.set(key, updated);
      return updated;
    }
  };
};
