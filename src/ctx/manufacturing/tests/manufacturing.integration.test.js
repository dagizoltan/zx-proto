import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createTestKvPool } from "../../../test-utils/kv-pool.js";
import { createKVWorkOrderRepositoryAdapter } from "../infrastructure/adapters/kv-work-order-repository.adapter.js";
import { createKVBomRepositoryAdapter } from "../infrastructure/adapters/kv-bom-repository.adapter.js";
import { createCreateWorkOrder } from "../application/use-cases/wo-use-cases.js";
import { Ok } from "../../../../lib/trust/index.js";

// Mock BOM Entity Creator (since we don't have access to the domain entity factory easily here without importing it)
const createMockBom = (id) => ({
    id,
    productId: "prod-1",
    components: []
});

Deno.test("Manufacturing Context - Integration Test", async (t) => {
  const kvPool = await createTestKvPool();

  await t.step("should create a work order via full stack", async () => {
    // 1. Setup Infrastructure
    const woRepository = createKVWorkOrderRepositoryAdapter(kvPool);
    const bomRepository = createKVBomRepositoryAdapter(kvPool);

    // 2. Setup Application
    const createWorkOrder = createCreateWorkOrder({ woRepository, bomRepository });

    // 3. Execution
    const tenantId = "test-tenant-integration-mfg";

    // Setup prerequisite data (BOM)
    const bomId = "bom-123";
    // We need to inject a BOM into the repo so validation passes
    // Since we don't have the BOM mapper/schema handy to create a perfect persistence object,
    // we'll try to rely on the repo saving a domain object if possible,
    // OR we just mock the bomRepository.findById behavior for this test to focus on WO creation.
    // However, the goal is integration. Let's try to mock the BOM repository just for the find part
    // but keep the WO repository real.

    const hybridBomRepository = {
        ...bomRepository,
        findById: (tid, id) => Promise.resolve(Ok(createMockBom(id)))
    };

    // Re-instantiate use case with hybrid repo
    const createWorkOrderWithMockBom = createCreateWorkOrder({
        woRepository,
        bomRepository: hybridBomRepository
    });

    const woInput = {
      bomId: bomId,
      quantity: 10,
      dueDate: new Date().toISOString()
    };

    // Create
    const createResult = await createWorkOrderWithMockBom.execute(tenantId, woInput);
    assert(createResult.ok, "Create Work Order should be successful");
    const createdWO = createResult.value;
    assertEquals(createdWO.quantity, 10);
    assertEquals(createdWO.bomId, bomId);

    // Verify Persistence
    const getResult = await woRepository.findById(tenantId, createdWO.id);
    assert(getResult.ok, "Get Work Order should be successful");
    const retrievedWO = getResult.value;

    assertEquals(retrievedWO.id, createdWO.id);
    assertEquals(retrievedWO.bomId, bomId);
  });

  await kvPool.close();
});
