import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createTestKvPool } from "../../../test-utils/kv-pool.js";
import { createKVWarehouseRepository } from "../infrastructure/adapters/kv-warehouse-repository.adapter.js";
import { createCreateWarehouse } from "../application/use-cases/create-warehouse.js";

Deno.test("Inventory Context - Integration Test", async (t) => {
  const kvPool = await createTestKvPool();

  await t.step("should create and retrieve a warehouse via full stack", async () => {
    // 1. Setup Infrastructure
    const warehouseRepository = createKVWarehouseRepository(kvPool);

    // 2. Setup Application
    const createWarehouse = createCreateWarehouse({
      warehouseRepository,
      eventBus: { publish: () => {} } // Mock event bus
    });

    // 3. Execution
    const tenantId = "test-tenant-integration-inventory";
    const warehouseInput = {
      name: "Integration Test Warehouse",
      location: "Test Location"
    };

    // Create
    const createdWarehouse = await createWarehouse.execute(tenantId, warehouseInput);
    assert(createdWarehouse, "Create Warehouse should return the warehouse");
    assertEquals(createdWarehouse.name, warehouseInput.name);
    assert(createdWarehouse.id, "Created warehouse should have an ID");

    // Retrieve (Directly from Repository to verify persistence)
    const getResult = await warehouseRepository.findById(tenantId, createdWarehouse.id);
    assert(getResult.ok, "Get Warehouse should be successful");
    const retrievedWarehouse = getResult.value;

    // Verify retrieval
    assertEquals(retrievedWarehouse.id, createdWarehouse.id);
    assertEquals(retrievedWarehouse.name, warehouseInput.name);
    assertEquals(retrievedWarehouse.location, warehouseInput.location);
  });

  await kvPool.close();
});
