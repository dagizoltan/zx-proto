
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVBOMRepositoryAdapter } from './kv-bom-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createBOM } from '../../domain/entities/bom.js';

Deno.test("KV BOM Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVBOMRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testBOM = createBOM({
        id: crypto.randomUUID(),
        tenantId,
        productId: crypto.randomUUID(),
        name: "Widget BOM",
        components: [{
            productId: crypto.randomUUID(),
            quantity: 1,
            unit: "pcs"
        }]
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testBOM);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testBOM.id);
        assertEquals(result.value.name, testBOM.name);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testBOM.id);
        assert(result.ok);
        assertEquals(result.value.id, testBOM.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await t.step("queryByIndex (productId)", async () => {
        const result = await repo.queryByIndex(tenantId, "productId", testBOM.productId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
