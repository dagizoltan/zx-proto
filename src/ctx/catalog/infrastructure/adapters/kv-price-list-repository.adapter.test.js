
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVPriceListRepositoryAdapter } from './kv-price-list-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createPriceList } from '../../domain/entities/price-list.js';

Deno.test("KV PriceList Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVPriceListRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testPriceList = createPriceList({
        id: crypto.randomUUID(),
        name: "Test Price List",
        currency: "USD",
        prices: [{ productId: crypto.randomUUID(), price: 100 }]
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testPriceList);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testPriceList.id);
        assertEquals(result.value.name, testPriceList.name);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testPriceList.id);
        assert(result.ok);
        assertEquals(result.value.id, testPriceList.id);
    });

    await t.step("findByCurrency", async () => {
        const result = await repo.findByCurrency(tenantId, "USD");
        assert(result.ok);
        assert(result.value.length > 0);
    });

    await kvPool.close();
});
