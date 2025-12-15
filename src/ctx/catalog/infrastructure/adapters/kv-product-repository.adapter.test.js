
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVProductRepositoryAdapter } from './kv-product-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createProduct } from '../../domain/entities/product.js';

Deno.test("KV Product Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVProductRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testProduct = createProduct({
        id: crypto.randomUUID(),
        sku: "TEST-SKU-001",
        name: "Test Product",
        description: "A product for testing",
        price: 99.99,
        type: "SIMPLE",
        status: "ACTIVE"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testProduct);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testProduct.id);
        assertEquals(result.value.sku, testProduct.sku);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testProduct.id);
        assert(result.ok);
        assertEquals(result.value.id, testProduct.id);
    });

    await t.step("findBySku", async () => {
        const result = await repo.findBySku(tenantId, testProduct.sku);
        assert(result.ok);
        assertEquals(result.value.id, testProduct.id);
    });

    await t.step("search", async () => {
        const result = await repo.search(tenantId, "Test");
        assert(result.ok);
        assert(result.value.length > 0);
    });

    await kvPool.close();
});
