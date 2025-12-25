
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createEventStore } from "../../infra/event-store/index.js";
import { createCommandBus } from "../../infra/command-bus/index.js";
import { createOutboxWorker } from "../../infra/messaging/worker/outbox-worker.js";
import { createManufacturingHandlers, ScheduleProduction, CompleteProduction } from "./domain/index.js";
import { createManufacturingProcessManager } from "./process-manager.js";
import { createInventoryHandlers, ReceiveStock, StockReceived } from "../inventory/domain/index.js";

// Mock Event Bus
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

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.test("Manufacturing Flow - Completion Updates Inventory", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };
    const eventBus = createEventBus();
    const eventStore = createEventStore(pool);
    const worker = createOutboxWorker(pool, eventBus);
    await worker.start();

    // 1. Setup Manufacturing
    const mfgCommandBus = createCommandBus(pool, eventStore);
    const mfgHandlers = createManufacturingHandlers();
    Object.keys(mfgHandlers).forEach(k => mfgCommandBus.registerHandler(k, mfgHandlers[k]));

    // 2. Setup Inventory
    const invCommandBus = createCommandBus(pool, eventStore);
    const invHandlers = createInventoryHandlers();
    Object.keys(invHandlers).forEach(k => invCommandBus.registerHandler(k, invHandlers[k]));

    // 3. Setup Process Manager
    const processManager = createManufacturingProcessManager(mfgCommandBus, invCommandBus);
    eventBus.subscribe('ProductionCompleted', async (data) => processManager.handle(data));

    const tenantId = "tenant-1";
    const prodOrderId = "wo-1";
    const productId = "finished-good-1";
    const rawMatId = "raw-1";

    // 4. Receive Raw Materials (Prerequisite)
    await invCommandBus.execute({
        type: ReceiveStock,
        aggregateId: rawMatId,
        tenantId,
        payload: { locationId: 'L1', batchId: 'B1', quantity: 100 }
    });

    // 5. Schedule Production (Needed for hydration of ProductID)
    await mfgCommandBus.execute({
        type: ScheduleProduction,
        aggregateId: prodOrderId,
        tenantId,
        payload: {
            productionOrderId: prodOrderId,
            productId,
            quantity: 10,
            rawMaterials: [{ productId: rawMatId, quantity: 20 }], // 2 raw per unit
            dueDate: null
        }
    });

    // 6. Complete Production
    await mfgCommandBus.execute({
        type: CompleteProduction,
        aggregateId: prodOrderId,
        tenantId,
        payload: {
            actualQuantity: 10
        }
    });

    await wait(200);

    // 7. Verify Inventory Updates
    // Should have Received Finished Goods
    const invHistory = await eventStore.readStream(tenantId, productId);
    // [Received?]
    // Wait, stream key is productId.
    // Check if 'StockReceived' event exists for finished good.
    const receivedEvent = invHistory.find(e => e.type === StockReceived);
    assertExists(receivedEvent, "Finished Goods should be received");
    assertEquals(receivedEvent.data.quantity, 10);
    assertEquals(receivedEvent.data.batchId, prodOrderId);

    // Should have Reserved Raw Materials
    const rawHistory = await eventStore.readStream(tenantId, rawMatId);
    const reservedEvent = rawHistory.find(e => e.type === 'StockReserved');
    assertExists(reservedEvent, "Raw Materials should be reserved");
    assertEquals(reservedEvent.data.totalReserved, 20);

    kv.close();
});
