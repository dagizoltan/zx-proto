
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVAuditRepository } from './kv-audit-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createAuditLog } from '../../domain/entities/audit-log.js';

Deno.test("KV Audit Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVAuditRepository(kvPool);
    const tenantId = "test-tenant";

    const testAudit = createAuditLog({
        id: crypto.randomUUID(),
        tenantId,
        userId: crypto.randomUUID(),
        action: "UPDATE",
        resource: "User",
        resourceId: crypto.randomUUID()
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testAudit);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testAudit.id);
        assertEquals(result.value.action, testAudit.action);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testAudit.id);
        assert(result.ok);
        assertEquals(result.value.id, testAudit.id);
    });

    await t.step("queryByIndex (resource)", async () => {
        const result = await repo.queryByIndex(tenantId, "resource", "User");
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
