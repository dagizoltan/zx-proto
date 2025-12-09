
import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { createSystemEventsListener } from '../src/ctx/system/application/listeners/system-events-listener.js';

// Mocks
const mockNotificationService = {
    notifications: [],
    notify: async (tid, n) => { mockNotificationService.notifications.push(n); }
};

const createMockEventBus = () => {
    const listeners = new Map();
    return {
        subscribe: (topic, fn) => {
            if (!listeners.has(topic)) listeners.set(topic, []);
            listeners.get(topic).push(fn);
        },
        publish: async (topic, payload) => {
            const fns = listeners.get(topic) || [];
            for (const fn of fns) await fn(payload);
        }
    };
};

Deno.test("System Events Listener", async (t) => {
    const mockBus = createMockEventBus();
    const listener = createSystemEventsListener({
        notificationService: mockNotificationService,
        eventBus: mockBus
    });

    listener.setupSubscriptions();

    await t.step("Order Created -> Notification", async () => {
        mockNotificationService.notifications = [];
        await mockBus.publish('order.created', { tenantId: 'T1', id: 'order-123', total: 500 });

        assertEquals(mockNotificationService.notifications.length, 1);
        const n = mockNotificationService.notifications[0];
        assertEquals(n.title, 'New Order Received');
        assertEquals(n.message.includes('order-12'), true);
    });

    await t.step("Product Created -> Notification", async () => {
        mockNotificationService.notifications = [];
        await mockBus.publish('catalog.product_created', { tenantId: 'T1', id: 'prod-1', name: 'Widget' });

        assertEquals(mockNotificationService.notifications.length, 1);
        assertEquals(mockNotificationService.notifications[0].title, 'New Product Added');
    });
});
