
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVMetricRepository } from './kv-metric-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';

Deno.test("KV Metric Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVMetricRepository(kvPool);
    const tenantId = "test-tenant";

    const testMetric = {
        id: crypto.randomUUID(),
        name: "cpu_usage",
        value: 45.5,
        tags: { host: "server-1" },
        timestamp: new Date().toISOString()
    };

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testMetric);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testMetric.id);
        assertEquals(result.value.name, testMetric.name);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testMetric.id);
        assert(result.ok);
        assertEquals(result.value.id, testMetric.id);
    });

    await t.step("queryByIndex (name)", async () => {
        const result = await repo.queryByIndex(tenantId, "name", "cpu_usage");
        assert(result.ok);
        assert(result.value.items.length > 0);
        assertEquals(result.value.items[0].name, "cpu_usage");
    });

    await kvPool.close();
});
