
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVLogRepository } from './kv-log-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createLog } from '../../domain/entities/log.js';

Deno.test("KV Log Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVLogRepository(kvPool);
    const tenantId = "test-tenant";

    const testLog = createLog({
        id: crypto.randomUUID(),
        tenantId,
        service: "auth-service",
        level: "INFO",
        message: "User logged in",
        meta: { userId: "user-1" }
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testLog);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testLog.id);
        assertEquals(result.value.level, testLog.level);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testLog.id);
        assert(result.ok);
        assertEquals(result.value.id, testLog.id);
    });

    await t.step("list (filter by level)", async () => {
        const result = await repo.list(tenantId, { level: "INFO" });
        assert(result.ok);
        assert(result.value.items.length > 0);
        assertEquals(result.value.items[0].level, "INFO");
    });

    await kvPool.close();
});
