import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createTestKvPool } from "../../../test-utils/kv-pool.js";
import { createKVLogRepository } from "../infrastructure/adapters/kv-log-repository.adapter.js";
import { createListLogs } from "../application/use-cases/list-logs.js";

Deno.test("Observability Context - Integration Test", async (t) => {
  const kvPool = await createTestKvPool();

  await t.step("should list logs via full stack", async () => {
    // 1. Setup Infrastructure
    const logRepository = createKVLogRepository(kvPool);

    // 2. Setup Application
    const listLogs = createListLogs({ logRepository });

    // 3. Execution
    const tenantId = "test-tenant-integration-obs";

    // Seed Data directly via Repository
    const logItem = {
        id: crypto.randomUUID(),
        level: "INFO",
        message: "Test Log",
        timestamp: new Date().toISOString(),
        service: "test-service",
        tenantId
    };

    await logRepository.save(tenantId, logItem);

    // List via Use Case
    const listResult = await listLogs.execute(tenantId, { limit: 10 });
    assert(listResult.ok, "List Logs should be successful");
    const logs = listResult.value.items;

    assert(logs.length >= 1, "Should find at least one log");
    const foundLog = logs.find(l => l.id === logItem.id);
    assert(foundLog, "Should find the seeded log");
    assertEquals(foundLog.message, logItem.message);
  });

  await kvPool.close();
});
