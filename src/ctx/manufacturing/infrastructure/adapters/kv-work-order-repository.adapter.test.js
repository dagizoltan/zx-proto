
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVWorkOrderRepositoryAdapter } from './kv-work-order-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createWorkOrder } from '../../domain/entities/work-order.js';

Deno.test("KV WorkOrder Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVWorkOrderRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testWorkOrder = createWorkOrder({
        id: crypto.randomUUID(),
        tenantId,
        bomId: crypto.randomUUID(),
        quantity: 100,
        status: "PLANNED"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testWorkOrder);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testWorkOrder.id);
        assertEquals(result.value.quantity, testWorkOrder.quantity);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testWorkOrder.id);
        assert(result.ok);
        assertEquals(result.value.id, testWorkOrder.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await t.step("query by status", async () => {
        const result = await repo.query(tenantId, { filter: { status: 'PLANNED' }});
        assert(result.ok);
        assert(result.value.items.length > 0);
        assertEquals(result.value.items[0].status, 'PLANNED');
    });

    await kvPool.close();
});
