
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVWarehouseRepository } from './kv-warehouse-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createWarehouse } from '../../domain/entities/warehouse.js';

Deno.test("KV Warehouse Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVWarehouseRepository(kvPool);
    const tenantId = "test-tenant";

    const testWarehouse = createWarehouse({
        id: crypto.randomUUID(),
        tenantId,
        name: "Main Warehouse",
        code: "WH-001",
        address: { city: "New York" }
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testWarehouse);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testWarehouse.id);
        assertEquals(result.value.code, testWarehouse.code);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testWarehouse.id);
        assert(result.ok);
        assertEquals(result.value.id, testWarehouse.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
