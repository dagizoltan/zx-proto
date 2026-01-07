
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createEventStore } from "../../../infra/event-store/index.js";
import { createCommandBus } from "../../../infra/command-bus/index.js";
import { createInventoryHandlers, ReceiveStock, ReserveStock, StockReceived, StockReserved, StockAllocationFailed } from "./index.js";

// Integration test for pure inventory domain
Deno.test("Inventory Domain - Allocation Logic", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };

    // 1. Setup Infra
    const eventStore = createEventStore(pool);
    const commandBus = createCommandBus(pool, eventStore);
    const handlers = createInventoryHandlers();
    Object.keys(handlers).forEach(k => commandBus.registerHandler(k, handlers[k]));

    const productId = "prod-1";
    const tenantId = "test-tenant";

    // 2. Receive Stock (Batch A: 10, Batch B: 5)
    await commandBus.execute({
        type: ReceiveStock,
        aggregateId: productId,
        tenantId,
        payload: { locationId: 'L1', batchId: 'B1', quantity: 10 }
    });

    await commandBus.execute({
        type: ReceiveStock,
        aggregateId: productId,
        tenantId,
        payload: { locationId: 'L1', batchId: 'B2', quantity: 5 }
    });

    // 3. Reserve Stock (Order 1: 12 units)
    // Should take 10 from B1, 2 from B2 (assuming FIFO based on insert order/timestamp)
    // Wait a tick to ensure timestamps differ? Handlers run async sequentially here.

    await commandBus.execute({
        type: ReserveStock,
        aggregateId: productId,
        tenantId,
        payload: { orderId: 'ord-1', quantity: 12 }
    });

    // 4. Verify History
    const history = await eventStore.readStream(tenantId, productId);
    assertEquals(history.length, 3);
    assertEquals(history[2].type, StockReserved);
    const allocs = history[2].data.allocations;
    assertEquals(allocs.length, 2);
    // B1 was first
    assertEquals(allocs[0].batchId, 'B1');
    assertEquals(allocs[0].quantity, 10);
    assertEquals(allocs[1].batchId, 'B2');
    assertEquals(allocs[1].quantity, 2);

    kv.close();
});

Deno.test("Inventory Domain - Insufficient Stock", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };

    const eventStore = createEventStore(pool);
    const commandBus = createCommandBus(pool, eventStore);
    const handlers = createInventoryHandlers();
    Object.keys(handlers).forEach(k => commandBus.registerHandler(k, handlers[k]));

    const productId = "prod-fail";
    const tenantId = "test-tenant";

    // Receive 5
    await commandBus.execute({
        type: ReceiveStock,
        aggregateId: productId,
        tenantId,
        payload: { locationId: 'L1', quantity: 5 }
    });

    // Try Reserve 10
    await commandBus.execute({
        type: ReserveStock,
        aggregateId: productId,
        tenantId,
        payload: { orderId: 'ord-fail', quantity: 10 }
    });

    const history = await eventStore.readStream(tenantId, productId);
    assertEquals(history.length, 2); // Receive + Failed
    assertEquals(history[1].type, StockAllocationFailed);
    assertEquals(history[1].data.reason, 'Insufficient Stock');

    kv.close();
});
