
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVActivityRepository } from './kv-activity-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createActivity } from '../../domain/entities/activity.js';

Deno.test("KV Activity Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVActivityRepository(kvPool);
    const tenantId = "test-tenant";

    const testActivity = createActivity({
        id: crypto.randomUUID(),
        tenantId,
        userId: crypto.randomUUID(),
        action: "LOGIN",
        meta: { ip: "127.0.0.1" }
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testActivity);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testActivity.id);
        assertEquals(result.value.action, testActivity.action);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testActivity.id);
        assert(result.ok);
        assertEquals(result.value.id, testActivity.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
