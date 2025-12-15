
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVLocationRepository } from './kv-location-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createLocation } from '../../domain/entities/warehouse.js';

Deno.test("KV Location Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVLocationRepository(kvPool);
    const tenantId = "test-tenant";

    const testLocation = createLocation({
        id: crypto.randomUUID(),
        tenantId,
        warehouseId: crypto.randomUUID(),
        code: "LOC-001",
        type: "SHELF"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testLocation);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testLocation.id);
        assertEquals(result.value.code, testLocation.code);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testLocation.id);
        assert(result.ok);
        assertEquals(result.value.id, testLocation.id);
    });

    await t.step("queryByIndex (code)", async () => {
        const result = await repo.queryByIndex(tenantId, "code", "LOC-001");
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
