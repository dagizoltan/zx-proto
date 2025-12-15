
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVTaskExecutionRepository } from './kv-task-execution-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createTaskExecution } from '../../domain/entities/task-execution.js';

Deno.test("KV TaskExecution Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVTaskExecutionRepository(kvPool);
    const tenantId = "test-tenant";

    const testExecution = createTaskExecution({
        id: crypto.randomUUID(),
        taskId: crypto.randomUUID(),
        handlerKey: "system.daily_cleanup",
        status: "RUNNING"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testExecution);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testExecution.id);
        assertEquals(result.value.status, testExecution.status);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testExecution.id);
        assert(result.ok);
        assertEquals(result.value.id, testExecution.id);
    });

    await t.step("queryByIndex (taskId)", async () => {
        const result = await repo.queryByIndex(tenantId, "taskId", testExecution.taskId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
