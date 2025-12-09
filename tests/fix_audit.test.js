
import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { createKVAuditRepository } from '../src/infra/persistence/kv/repositories/kv-audit-repository.js';

// Mock KV Pool
const createMockPool = () => {
    const store = new Map();
    const kv = {
        set: async (key, val) => { store.set(JSON.stringify(key), val); },
        get: async (key) => ({ value: store.get(JSON.stringify(key)) }),
        list: () => ({ [Symbol.asyncIterator]: async function*() { yield* [] } })
    };
    return {
        withConnection: async (fn) => await fn(kv)
    };
};

Deno.test("Audit Log Repository", async (t) => {
    const pool = createMockPool();
    const repo = createKVAuditRepository(pool);

    await t.step("Save Log", async () => {
        const log = { id: 'log-1', action: 'CREATE', resource: 'products' };
        await repo.save('T1', log);

        const fetched = await repo.findById('T1', 'log-1');
        assertEquals(fetched.action, 'CREATE');
    });
});
