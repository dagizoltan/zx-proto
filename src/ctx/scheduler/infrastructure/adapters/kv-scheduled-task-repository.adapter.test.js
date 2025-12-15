
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVScheduledTaskRepository } from './kv-scheduled-task-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createScheduledTask } from '../../domain/entities/scheduled-task.js';

Deno.test("KV ScheduledTask Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVScheduledTaskRepository(kvPool);
    const tenantId = "test-tenant";

    const testTask = createScheduledTask({
        id: crypto.randomUUID(),
        handlerKey: "system.daily_cleanup",
        name: "Daily Cleanup",
        cronExpression: "0 0 * * *",
        enabled: true
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testTask);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testTask.id);
        assertEquals(result.value.handlerKey, testTask.handlerKey);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testTask.id);
        assert(result.ok);
        assertEquals(result.value.id, testTask.id);
    });

    await t.step("queryByIndex (handlerKey)", async () => {
        const result = await repo.queryByIndex(tenantId, "handlerKey", testTask.handlerKey);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
