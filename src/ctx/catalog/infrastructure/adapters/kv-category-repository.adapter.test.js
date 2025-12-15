
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVCategoryRepositoryAdapter } from './kv-category-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createCategory } from '../../domain/entities/category.js';

Deno.test("KV Category Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVCategoryRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testCategory = createCategory({
        id: crypto.randomUUID(),
        name: "Test Category",
        description: "A category for testing"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testCategory);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testCategory.id);
        assertEquals(result.value.name, testCategory.name);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testCategory.id);
        assert(result.ok);
        assertEquals(result.value.id, testCategory.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
