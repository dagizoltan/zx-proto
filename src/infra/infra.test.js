
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createEventStore } from "./event-store/index.js";
import { createOutboxWorker } from "./messaging/worker/outbox-worker.js";
import { createReplayService } from "./replay/index.js";

// Mock Event Bus
const createEventBus = () => {
    const published = [];
    return {
        publish: async (type, payload) => {
            published.push({ type, payload });
        },
        getPublished: () => published
    };
};

Deno.test("Infrastructure - Outbox Reliability", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };
    const eventBus = createEventBus();

    // 1. Setup EventStore with Outbox
    const eventStore = createEventStore(pool);

    // 2. Setup Worker
    const worker = createOutboxWorker(pool, eventBus);
    await worker.start(); // Starts listening to queue

    // 3. Append Event (Should Enqueue)
    await eventStore.append("tenant-1", "stream-1", [{ type: "TestEvent", data: "foo" }]);

    // 4. Wait for Queue Processing (Async)
    // Deno KV Queue in memory is fast, but we need to yield event loop.
    await new Promise(r => setTimeout(r, 100));

    // 5. Verify EventBus received it
    const published = eventBus.getPublished();
    assertEquals(published.length, 1);
    assertEquals(published[0].type, "TestEvent");

    kv.close();
});

Deno.test("Infrastructure - Replay Mechanism", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };
    const replayBus = createEventBus(); // Bus for replay
    const eventStore = createEventStore(pool);

    // 1. Seed Data
    await eventStore.append("tenant-1", "stream-1", [{ type: "EventA" }]);
    await eventStore.append("tenant-1", "stream-1", [{ type: "EventB" }]);
    await eventStore.append("tenant-2", "stream-X", [{ type: "EventC" }]); // Different tenant

    // 2. Run Replay for tenant-1
    const replayer = createReplayService(eventStore, replayBus);
    const count = await replayer.replay("tenant-1");

    // 3. Verify
    assertEquals(count, 2);
    const published = replayBus.getPublished();
    assertEquals(published.length, 2);
    assertEquals(published[0].type, "EventA");
    assertEquals(published[1].type, "EventB");

    kv.close();
});
