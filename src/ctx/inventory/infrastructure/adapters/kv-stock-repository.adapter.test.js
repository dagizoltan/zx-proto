
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVStockRepositoryAdapter } from './kv-stock-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createStockEntry } from '../../domain/entities/stock-entry.js';

Deno.test("KV Stock Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVStockRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testStock = createStockEntry({
        id: crypto.randomUUID(),
        tenantId,
        productId: crypto.randomUUID(),
        locationId: crypto.randomUUID(),
        quantity: 100,
        reservedQuantity: 10,
        batchId: crypto.randomUUID()
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testStock);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testStock.id);
        assertEquals(result.value.quantity, testStock.quantity);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testStock.id);
        assert(result.ok);
        assertEquals(result.value.id, testStock.id);
    });

    await t.step("findByProduct", async () => {
        const result = await repo.findByProduct(tenantId, testStock.productId);
        assert(result.ok);
        assert(result.value.length > 0);
    });

    await t.step("findByLocation", async () => {
        const result = await repo.findByLocation(tenantId, testStock.locationId);
        assert(result.ok);
        assert(result.value.length > 0);
    });

    await kvPool.close();
});
