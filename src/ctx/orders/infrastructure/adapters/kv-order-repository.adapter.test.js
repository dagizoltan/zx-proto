
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVOrderRepositoryAdapter } from './kv-order-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createOrder } from '../../domain/entities/order.js';

Deno.test("KV Order Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVOrderRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testOrder = createOrder({
        id: crypto.randomUUID(),
        tenantId,
        customerId: crypto.randomUUID(),
        items: [{
            productId: crypto.randomUUID(),
            quantity: 2,
            unitPrice: 50,
            totalPrice: 100,
            productName: "Test Widget"
        }],
        totalAmount: 100,
        status: "CREATED",
        paymentStatus: "PENDING"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testOrder);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testOrder.id);
        assertEquals(result.value.totalAmount, testOrder.totalAmount);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testOrder.id);
        assert(result.ok);
        assertEquals(result.value.id, testOrder.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await t.step("query by status", async () => {
        const result = await repo.query(tenantId, { filter: { status: 'CREATED' }});
        assert(result.ok);
        assert(result.value.items.length > 0);
        assertEquals(result.value.items[0].status, 'CREATED');
    });

    await kvPool.close();
});
