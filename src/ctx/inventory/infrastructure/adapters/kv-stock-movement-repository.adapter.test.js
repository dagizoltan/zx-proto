
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVStockMovementRepository } from './kv-stock-movement-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createStockMovement } from '../../domain/entities/stock-movement.js';

Deno.test("KV Stock Movement Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVStockMovementRepository(kvPool);
    const tenantId = "test-tenant";

    const testMovement = createStockMovement({
        id: crypto.randomUUID(),
        tenantId,
        productId: crypto.randomUUID(),
        quantity: 50,
        type: "received",
        toLocationId: crypto.randomUUID(),
        referenceId: "REF-001"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testMovement);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testMovement.id);
        assertEquals(result.value.quantity, testMovement.quantity);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testMovement.id);
        assert(result.ok);
        assertEquals(result.value.id, testMovement.id);
    });

    await t.step("queryByIndex (referenceId)", async () => {
        const result = await repo.queryByIndex(tenantId, "referenceId", "REF-001");
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
