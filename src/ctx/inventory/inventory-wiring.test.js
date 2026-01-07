
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createInventoryContext } from "./index.js";
import { createEventStore } from "../../infra/event-store/index.js";
import { createOutboxWorker } from "../../infra/messaging/worker/outbox-worker.js";

// Mock dependencies
const createMockDeps = (kvPool, eventStore, eventBus) => {
    // Return a structure that satisfies `dependency-resolver.js` logic.
    // Logic: nested objects OR fallback keys.
    // Fallbacks: kvPool, eventBus, eventStore, cache, obs.
    return {
        // High-Level Context Access via get() for AutoGateway
        get: (name) => {
            if (name === 'domain.catalog') return { getProduct: () => {}, listProducts: () => {} };
            if (name === 'domain.access-control') return { checkPermission: () => ({ ok: true }) };
            return {};
        },
        // Flat properties for fallback resolution
        kvPool,
        eventBus,
        eventStore,
        cache: { get: () => null, set: () => null },
        obs: { info: () => {}, error: () => {} }
    };
};

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

// Wait helper
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.test("Inventory Context - Wiring Integration", async () => {
    const kv = await Deno.openKv(":memory:");
    const kvPool = { withConnection: async (cb) => cb(kv) };
    const eventBus = createMockEventBus();
    const eventStore = createEventStore(kvPool);
    const worker = createOutboxWorker(kvPool, eventBus);
    await worker.start();

    // 1. Initialize Context
    const deps = createMockDeps(kvPool, eventStore, eventBus);
    const ctx = await createInventoryContext(deps);

    // 2. Receive Stock (Write)
    const tenantId = "tenant-1";
    const productId = "prod-1";
    await ctx.useCases.receiveStock.execute(tenantId, [{
        productId,
        locationId: "L1",
        batchId: "B1",
        quantity: 10
    }], "GRN-001");

    // Wait for Outbox -> EventBus -> Projector
    await wait(200);

    // 3. Check View (Read)
    const repoRes = await ctx.repositories.stock.query(tenantId, { filter: { productId } });

    assertEquals(repoRes.ok, true);
    assertEquals(repoRes.value.total, 1);
    assertEquals(repoRes.value.items[0].quantity, 10);
    assertEquals(repoRes.value.items[0].batchId, "B1");

    kv.close();
});
