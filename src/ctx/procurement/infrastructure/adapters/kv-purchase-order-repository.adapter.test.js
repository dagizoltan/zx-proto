
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVPurchaseOrderRepositoryAdapter } from './kv-purchase-order-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createPurchaseOrder } from '../../domain/entities/purchase-order.js';

Deno.test("KV Purchase Order Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVPurchaseOrderRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testPO = createPurchaseOrder({
        id: crypto.randomUUID(),
        tenantId,
        supplierId: crypto.randomUUID(),
        code: "PO-001",
        status: "DRAFT",
        items: [{ productId: crypto.randomUUID(), quantity: 10 }]
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testPO);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testPO.id);
        assertEquals(result.value.code, testPO.code);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testPO.id);
        assert(result.ok);
        assertEquals(result.value.id, testPO.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await t.step("query by status", async () => {
        const result = await repo.query(tenantId, { filter: { status: 'DRAFT' }});
        assert(result.ok);
        assert(result.value.items.length > 0);
        assertEquals(result.value.items[0].status, 'DRAFT');
    });

    await kvPool.close();
});
