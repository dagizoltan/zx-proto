
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createEventStore } from "../../infra/event-store/index.js";
import { createCommandBus } from "../../infra/command-bus/index.js";
import { createOrderHandlers, InitializeOrder, OrderConfirmed, OrderRejected } from "./domain.js";
import { createOrderProjector } from "./projector.js";
import { createOrderProcessManager } from "./process-manager.js";

// Mock Objects
const createMockEventBus = () => {
    const handlers = new Map();
    const published = [];
    return {
        publish: async (type, payload) => {
            published.push({ type, payload });
            const subs = handlers.get(type) || [];
            await Promise.all(subs.map(fn => fn(payload)));
        },
        subscribe: (type, fn) => {
            if (!handlers.has(type)) handlers.set(type, []);
            handlers.get(type).push(fn);
        },
        getPublished: () => published
    };
};

const createMockInventoryGateway = (shouldSucceed = true) => ({
    reserveStock: {
        execute: async () => {
            if (!shouldSucceed) return { success: false };
            return { success: true };
        }
    }
});

Deno.test("Orders - Async Flow (Success)", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };

    // 1. Setup Infra
    const eventBus = createMockEventBus();
    const eventStore = createEventStore(pool); // No auto-publish in raw store, CommandBus handles it
    const commandBus = createCommandBus(pool, eventStore, eventBus);

    // 2. Setup Domain
    const handlers = createOrderHandlers();
    Object.keys(handlers).forEach(k => commandBus.registerHandler(k, handlers[k]));

    const projector = createOrderProjector(pool);
    const processManager = createOrderProcessManager(commandBus, createMockInventoryGateway(true));

    // Wire Subscriptions (mimic src/ctx/orders/index.js)
    eventBus.subscribe('OrderInitialized', async (data) => {
        await projector.handle(data);
        await processManager.handle(data);
    });
    eventBus.subscribe('OrderConfirmed', async (data) => projector.handle(data));
    eventBus.subscribe('OrderRejected', async (data) => projector.handle(data));

    // 3. Execute: Create Order
    const tenantId = "test-tenant";
    const orderId = "order-1";

    await commandBus.execute({
        type: InitializeOrder,
        aggregateId: orderId,
        tenantId,
        payload: {
            tenantId,
            customerId: "cust-1",
            items: [{ id: "p1", qty: 1 }]
        }
    });

    // 4. Verify Immediate State (Projector should have run for Initialized)
    const viewKey = ['view', 'orders', tenantId, orderId];
    let view = (await kv.get(viewKey)).value;
    assertExists(view);
    assertEquals(view.status, 'CONFIRMED');

    // Check Event History
    const history = await eventStore.readStream(tenantId, orderId);
    assertEquals(history.length, 2);
    assertEquals(history[0].type, 'OrderInitialized');
    assertEquals(history[1].type, 'OrderConfirmed');

    kv.close();
});

Deno.test("Orders - Async Flow (Inventory Failure)", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };

    const eventBus = createMockEventBus();
    const eventStore = createEventStore(pool);
    const commandBus = createCommandBus(pool, eventStore, eventBus);

    const handlers = createOrderHandlers();
    Object.keys(handlers).forEach(k => commandBus.registerHandler(k, handlers[k]));

    const projector = createOrderProjector(pool);
    // FAIL INVENTORY
    const processManager = createOrderProcessManager(commandBus, createMockInventoryGateway(false));

    eventBus.subscribe('OrderInitialized', async (data) => {
        await projector.handle(data);
        await processManager.handle(data);
    });
    eventBus.subscribe('OrderRejected', async (data) => projector.handle(data));

    const tenantId = "test-tenant";

    // Test Case: Valid Order but Out of Stock
    await commandBus.execute({
        type: InitializeOrder,
        aggregateId: "order-fail-2",
        tenantId,
        payload: { tenantId, customerId: "c1", items: [{id:'p1'}] }
    });

    const view = (await kv.get(['view', 'orders', tenantId, "order-fail-2"])).value;
    assertEquals(view.status, 'REJECTED');
    assertEquals(view.reason, 'Out of Stock');

    kv.close();
});
