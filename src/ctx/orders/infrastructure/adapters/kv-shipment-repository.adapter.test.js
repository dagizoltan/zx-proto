
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVShipmentRepositoryAdapter } from './kv-shipment-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createShipment } from '../../domain/entities/shipment.js';

Deno.test("KV Shipment Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVShipmentRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testShipment = createShipment({
        id: crypto.randomUUID(),
        tenantId,
        orderId: crypto.randomUUID(),
        code: "SHIP-001",
        carrier: "FedEx",
        trackingNumber: "TRACK123",
        items: [{
            productId: crypto.randomUUID(),
            quantity: 1
        }]
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testShipment);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testShipment.id);
        assertEquals(result.value.trackingNumber, testShipment.trackingNumber);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testShipment.id);
        assert(result.ok);
        assertEquals(result.value.id, testShipment.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await t.step("queryByIndex (orderId)", async () => {
        const result = await repo.queryByIndex(tenantId, 'orderId', testShipment.orderId);
        assert(result.ok);
        assert(result.value.items.length > 0);
        assertEquals(result.value.items[0].orderId, testShipment.orderId);
    });

    await kvPool.close();
});
