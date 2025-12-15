
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVSupplierRepositoryAdapter } from './kv-supplier-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createSupplier } from '../../domain/entities/supplier.js';

Deno.test("KV Supplier Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVSupplierRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testSupplier = createSupplier({
        id: crypto.randomUUID(),
        tenantId,
        name: "Acme Corp",
        code: "SUP-001",
        email: "contact@acme.com",
        status: "ACTIVE"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testSupplier);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testSupplier.id);
        assertEquals(result.value.name, testSupplier.name);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testSupplier.id);
        assert(result.ok);
        assertEquals(result.value.id, testSupplier.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await t.step("queryByIndex (code)", async () => {
        const result = await repo.queryByIndex(tenantId, "code", "SUP-001");
        assert(result.ok);
        assert(result.value.items.length > 0);
        assertEquals(result.value.items[0].code, "SUP-001");
    });

    await kvPool.close();
});
