import { Notification, NotificationLevel } from '../notification.js';

export const createNotificationService = ({ notificationRepo }) => {
  // Simple in-memory sub list for SSE
  // Map<tenantId, Set<Controller>>
  const clients = new Map();

  const addClient = (tenantId, controller) => {
    if (!clients.has(tenantId)) {
      clients.set(tenantId, new Set());
    }
    clients.get(tenantId).add(controller);
    // Cleanup on close is handled by the route handler usually,
    // but we need a way to remove it here.
    // actually, we'll return a cleanup function.
    return () => {
      const set = clients.get(tenantId);
      if (set) {
        set.delete(controller);
        if (set.size === 0) clients.delete(tenantId);
      }
    };
  };

  const broadcast = (tenantId, payload) => {
    const set = clients.get(tenantId);
    if (!set) return;

    const data = JSON.stringify(payload);
    for (const controller of set) {
      try {
        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
      } catch (e) {
        // Client likely disconnected
        console.error('SSE Broadcast error', e);
      }
    }
  };

  return {
    notify: async (tenantId, { userId, level, title, message, link }) => {
      const notification = Notification({
        id: crypto.randomUUID(),
        tenantId,
        userId,
        level,
        title,
        message,
        link
      });

      await notificationRepo.save(tenantId, notification);

      // Real-time push
      // Filter for user specific?
      // Current simple broadcast sends to all tenant users.
      // Client-side can filter or we filter here.
      // For simplicity in this phase, we broadcast to tenant,
      // and let's assume the payload includes userId so client can ignore if not for them.
      broadcast(tenantId, notification.toJSON());

      return notification;
    },

    list: async (tenantId, params) => {
      return notificationRepo.list(tenantId, params);
    },

    markAsRead: async (tenantId, id) => {
      return notificationRepo.markAsRead(tenantId, id);
    },

    // SSE Stream
    subscribe: (tenantId) => {
      let cleanup;
      const body = new ReadableStream({
        start(controller) {
          cleanup = addClient(tenantId, controller);
          // Send initial ping
          controller.enqueue(new TextEncoder().encode(': connected\n\n'));
        },
        cancel() {
          if (cleanup) cleanup();
        }
      });
      return body;
    }
  };
};
