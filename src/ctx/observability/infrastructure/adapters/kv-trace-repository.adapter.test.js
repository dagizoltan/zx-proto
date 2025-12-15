
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVTraceRepository } from './kv-trace-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';

Deno.test("KV Trace Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVTraceRepository(kvPool);
    const tenantId = "test-tenant";

    const testTrace = {
        id: crypto.randomUUID(),
        traceId: crypto.randomUUID(),
        spanName: "GET /api/users",
        duration: 120,
        success: true,
        timestamp: new Date().toISOString()
    };

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testTrace);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testTrace.id);
        assertEquals(result.value.traceId, testTrace.traceId);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testTrace.id);
        assert(result.ok);
        assertEquals(result.value.id, testTrace.id);
    });

    await t.step("queryByIndex (traceId)", async () => {
        const result = await repo.queryByIndex(tenantId, "traceId", testTrace.traceId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
