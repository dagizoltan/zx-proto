
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createEventStore } from "../../infra/event-store/index.js";
import { createCommandBus } from "../../infra/command-bus/index.js";
import { createOrderHandlers, InitializeOrder } from "./domain.js";
import { createOrderProjector } from "./projector.js";
import { createOrderProcessManager } from "./process-manager.js";
import { createInventoryHandlers, ReceiveStock, ReserveStock, StockReceived, StockReserved, StockAllocationFailed } from "../inventory/domain/index.js";
import { createOutboxWorker } from "../../infra/messaging/worker/outbox-worker.js";

// Mock Event Bus that routes to multiple subscribers
const createEventBus = () => {
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

// Wait helper
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.test("Full System - Order -> Inventory -> Order", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };
    const eventBus = createEventBus();
    const eventStore = createEventStore(pool);
    const worker = createOutboxWorker(pool, eventBus);
    await worker.start();

    // 1. Setup Order Context
    const orderCommandBus = createCommandBus(pool, eventStore);
    const orderHandlers = createOrderHandlers();
    Object.keys(orderHandlers).forEach(k => orderCommandBus.registerHandler(k, orderHandlers[k]));
    const orderProjector = createOrderProjector(pool);

    // 2. Setup Inventory Context
    const inventoryCommandBus = createCommandBus(pool, eventStore);
    const inventoryHandlers = createInventoryHandlers();
    Object.keys(inventoryHandlers).forEach(k => inventoryCommandBus.registerHandler(k, inventoryHandlers[k]));

    // 3. Setup Process Manager
    const processManager = createOrderProcessManager(orderCommandBus, inventoryCommandBus);

    // 4. Wiring
    const wire = (type) => {
        eventBus.subscribe(type, async (data) => {
            await orderProjector.handle(data);
            await processManager.handle(data);
        });
    }
    ['OrderInitialized', 'StockReserved', 'StockAllocationFailed', 'OrderConfirmed', 'OrderRejected'].forEach(wire);

    // 5. Seed Inventory
    const tenantId = "tenant-1";
    const productId = "prod-1";
    await inventoryCommandBus.execute({
        type: ReceiveStock,
        aggregateId: productId,
        tenantId,
        payload: { locationId: 'L1', batchId: 'B1', quantity: 10 }
    });

    // 6. Execute Order
    const orderId = "order-1";
    await orderCommandBus.execute({
        type: InitializeOrder,
        aggregateId: orderId,
        tenantId,
        payload: {
            tenantId,
            customerId: "cust-1",
            items: [{ id: productId, qty: 5 }]
        }
    });

    // 7. Verification
    await wait(200);

    // Check Event Stream for Order
    const orderHistory = await eventStore.readStream(tenantId, orderId);
    assertEquals(orderHistory.length, 2);
    assertEquals(orderHistory[0].type, 'OrderInitialized');
    assertEquals(orderHistory[1].type, 'OrderConfirmed');

    // Check Event Stream for Inventory
    const invHistory = await eventStore.readStream(tenantId, productId);
    // [Received, Reserved]
    assertEquals(invHistory.length, 2);
    assertEquals(invHistory[1].type, StockReserved);
    assertEquals(invHistory[1].data.orderId, orderId);

    // Check Read Model
    const view = (await kv.get(['view', 'orders', tenantId, orderId])).value;
    assertExists(view);
    assertEquals(view.status, 'CONFIRMED');

    kv.close();
});

Deno.test("Full System - Out of Stock Flow", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };
    const eventBus = createEventBus();
    const eventStore = createEventStore(pool);
    const worker = createOutboxWorker(pool, eventBus);
    await worker.start();

    const orderCommandBus = createCommandBus(pool, eventStore);
    const orderHandlers = createOrderHandlers();
    Object.keys(orderHandlers).forEach(k => orderCommandBus.registerHandler(k, orderHandlers[k]));
    const orderProjector = createOrderProjector(pool);

    const inventoryCommandBus = createCommandBus(pool, eventStore);
    const inventoryHandlers = createInventoryHandlers();
    Object.keys(inventoryHandlers).forEach(k => inventoryCommandBus.registerHandler(k, inventoryHandlers[k]));

    const processManager = createOrderProcessManager(orderCommandBus, inventoryCommandBus);

    ['OrderInitialized', 'StockReserved', 'StockAllocationFailed', 'OrderConfirmed', 'OrderRejected'].forEach(t =>
        eventBus.subscribe(t, async (d) => { await orderProjector.handle(d); await processManager.handle(d); })
    );

    // No Stock Seeded!

    const tenantId = "tenant-1";
    const productId = "prod-empty";
    const orderId = "order-fail";

    await orderCommandBus.execute({
        type: InitializeOrder,
        aggregateId: orderId,
        tenantId,
        payload: {
            tenantId,
            customerId: "cust-1",
            items: [{ id: productId, qty: 1 }]
        }
    });

    await wait(200);

    const orderHistory = await eventStore.readStream(tenantId, orderId);
    // [Initialized, Rejected]
    assertEquals(orderHistory.length, 2);
    assertEquals(orderHistory[1].type, 'OrderRejected');
    assertEquals(orderHistory[1].data.reason, 'Insufficient Stock');

    kv.close();
});
