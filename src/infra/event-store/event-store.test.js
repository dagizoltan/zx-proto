
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createEventStore } from "./index.js";

// Mock KVPool
const createMockKvPool = () => {
    const kv = {
        store: new Map(),
        get: async (key) => {
            const val = kv.store.get(JSON.stringify(key));
            return { value: val === undefined ? null : val, versionstamp: 'mock' };
        },
        list: async function* ({ prefix }) {
            const prefixStr = JSON.stringify(prefix).slice(0, -1); // Simple prefix match hack for mock
            const keys = Array.from(kv.store.keys()).sort();
            for (const keyStr of keys) {
                if (keyStr.startsWith(prefixStr)) {
                     yield { key: JSON.parse(keyStr), value: kv.store.get(keyStr) };
                }
            }
        },
        atomic: () => {
            const ops = [];
            const checks = [];
            return {
                set: (key, value) => {
                    ops.push({ type: 'set', key, value });
                    return this; // chainable?
                },
                check: (res) => {
                    checks.push(res);
                },
                commit: async () => {
                    // Simple check simulation
                    for(const check of checks) {
                         const current = await kv.get(check.key); // check.key isn't on the result object in real KV but let's assume we passed the entry
                         // This mock is too simple for robust atomic check logic without the key being passed back in the result
                         // But for our EventStore implementation: atomicOp.check(currentVersionResult);
                         // The result of `get` contains `key` in Deno KV? No, just value and versionstamp.
                         // But `atomicOp.check({ key, versionstamp })` is how it works.
                         // Our implementation passed `currentVersionResult` which came from `get`.
                         // `get` returns `{ key, value, versionstamp }`? No, `kv.get` returns `Promise<KvEntryMaybe<T>>`.
                         // `KvEntryMaybe` has `key`, `value`, `versionstamp`.
                    }

                    // Apply ops
                    for (const op of ops) {
                        if (op.type === 'set') {
                            kv.store.set(JSON.stringify(op.key), op.value);
                        }
                    }
                    return { ok: true };
                }
            }
        }
    };

    // Fix `get` to return key as well for `check` to work conceptually
    const originalGet = kv.get;
    kv.get = async (key) => {
        const res = await originalGet(key);
        return { ...res, key };
    }

    return {
        withConnection: async (cb) => cb(kv)
    };
};

// Use real KV for test? No, requires --unstable. Mock is safer for environment.
// But let's try to write a test that runs with `deno test` if environment allows.
// The user has Deno installed.

Deno.test("EventStore - append and read", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };
    const eventStore = createEventStore(pool);
    const tenantId = "tenant-1";
    const streamId = "order-123";

    await eventStore.append(tenantId, streamId, [{ type: "OrderCreated", data: { total: 100 } }]);

    const events = await eventStore.readStream(tenantId, streamId);
    assertEquals(events.length, 1);
    assertEquals(events[0].version, 1);
    assertEquals(events[0].data.total, 100);

    // Append second event
    await eventStore.append(tenantId, streamId, [{ type: "OrderShipped" }], 1);

    const events2 = await eventStore.readStream(tenantId, streamId);
    assertEquals(events2.length, 2);
    assertEquals(events2[1].version, 2);
    assertEquals(events2[1].type, "OrderShipped");

    kv.close();
});

Deno.test("EventStore - concurrency error", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };
    const eventStore = createEventStore(pool);
    const tenantId = "tenant-1";
    const streamId = "concurrency-test";

    await eventStore.append(tenantId, streamId, [{ type: "Event1" }]); // Version 1

    // Try to append with wrong expected version (expecting 0, but is 1)
    await assertRejects(
        async () => {
            await eventStore.append(tenantId, streamId, [{ type: "Event2" }], 0);
        },
        Error,
        "ConcurrencyError"
    );

    kv.close();
});
