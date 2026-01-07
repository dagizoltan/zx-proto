
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createEventStore } from "../../infra/event-store/index.js";
import { createCommandBus } from "../../infra/command-bus/index.js";
import { createOrderHandlers, InitializeOrder, OrderConfirmed, OrderRejected } from "./domain.js";
import { createOrderProjector } from "./projector.js";
import { createOrderProcessManager } from "./process-manager.js";
import { createOutboxWorker } from "../../infra/messaging/worker/outbox-worker.js";
import { ReserveStock, StockReserved, StockAllocationFailed } from "../inventory/domain/index.js";

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

// Mock Command Bus for Inventory
const createMockInventoryCommandBus = (eventBus, shouldSucceed = true) => {
    return {
        execute: async (command) => {
            if (command.type === ReserveStock) {
                const { orderId, quantity } = command.payload;
                // Simulate Async reaction via EventBus
                // We use setTimeout to mimic async nature or just await?
                // `execute` returns, then events fire.

                if (shouldSucceed) {
                    await eventBus.publish(StockReserved, {
                         type: StockReserved,
                         tenantId: command.tenantId,
                         data: {
                             productId: command.aggregateId,
                             orderId,
                             allocations: [{ batchId: 'B1', quantity }],
                             totalReserved: quantity,
                             timestamp: Date.now()
                         }
                    });
                } else {
                     await eventBus.publish(StockAllocationFailed, {
                         type: StockAllocationFailed,
                         tenantId: command.tenantId,
                         data: {
                             productId: command.aggregateId,
                             orderId,
                             reason: 'Out of Stock'
                         }
                    });
                }
            }
        },
        registerHandler: () => {}
    };
};

// Helper to wait for queue processing
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.test("Orders - Async Flow (Success) with Outbox", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };

    // 1. Setup Infra
    const eventBus = createMockEventBus();
    const eventStore = createEventStore(pool);
    const worker = createOutboxWorker(pool, eventBus);
    await worker.start(); // MUST START WORKER

    // CommandBus NO LONGER takes eventBus, it relies on EventStore Outbox
    const commandBus = createCommandBus(pool, eventStore);

    // 2. Setup Domain
    const handlers = createOrderHandlers();
    Object.keys(handlers).forEach(k => commandBus.registerHandler(k, handlers[k]));

    const projector = createOrderProjector(pool);
    const processManager = createOrderProcessManager(commandBus, createMockInventoryCommandBus(eventBus, true));

    // Wire Subscriptions
    eventBus.subscribe('OrderInitialized', async (data) => {
        await projector.handle(data);
        await processManager.handle(data);
    });
    eventBus.subscribe('StockReserved', async (data) => processManager.handle(data)); // Process Manager reacts to stock
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

    // 4. Verify Immediate State (Wait for Queue)
    await wait(200); // Allow worker to pick up events

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

Deno.test("Orders - Async Flow (Inventory Failure) with Outbox", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };

    const eventBus = createMockEventBus();
    const eventStore = createEventStore(pool);
    const worker = createOutboxWorker(pool, eventBus);
    await worker.start();

    const commandBus = createCommandBus(pool, eventStore);

    const handlers = createOrderHandlers();
    Object.keys(handlers).forEach(k => commandBus.registerHandler(k, handlers[k]));

    const projector = createOrderProjector(pool);
    // FAIL INVENTORY
    const processManager = createOrderProcessManager(commandBus, createMockInventoryCommandBus(eventBus, false));

    eventBus.subscribe('OrderInitialized', async (data) => {
        await projector.handle(data);
        await processManager.handle(data);
    });
    eventBus.subscribe('StockAllocationFailed', async (data) => processManager.handle(data));
    eventBus.subscribe('OrderRejected', async (data) => projector.handle(data));

    const tenantId = "test-tenant";

    // Test Case: Valid Order but Out of Stock
    await commandBus.execute({
        type: InitializeOrder,
        aggregateId: "order-fail-2",
        tenantId,
        payload: { tenantId, customerId: "c1", items: [{id:'p1'}] }
    });

    await wait(200);

    const view = (await kv.get(['view', 'orders', tenantId, "order-fail-2"])).value;
    assertExists(view, "View should exist");
    assertEquals(view.status, 'REJECTED');
    assertEquals(view.reason, 'Out of Stock');

    kv.close();
});
