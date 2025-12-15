
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVBatchRepository } from './kv-batch-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createBatch } from '../../domain/entities/warehouse.js';

Deno.test("KV Batch Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVBatchRepository(kvPool);
    const tenantId = "test-tenant";

    const testBatch = createBatch({
        id: crypto.randomUUID(),
        tenantId,
        sku: "TEST-SKU",
        batchNumber: "BATCH-001",
        receivedAt: new Date().toISOString()
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testBatch);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testBatch.id);
        assertEquals(result.value.batchNumber, testBatch.batchNumber);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testBatch.id);
        assert(result.ok);
        assertEquals(result.value.id, testBatch.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
