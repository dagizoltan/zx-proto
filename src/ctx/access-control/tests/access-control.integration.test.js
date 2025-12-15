import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createTestKvPool } from "../../../test-utils/kv-pool.js";
import { createKVRoleRepositoryAdapter } from "../infrastructure/adapters/kv-role-repository.adapter.js";
import { createCreateRole } from "../application/use-cases/create-role.js";
import { createGetRole } from "../application/use-cases/get-role.js";

Deno.test("Access Control Context - Integration Test", async (t) => {
  const kvPool = await createTestKvPool();

  await t.step("should create and retrieve a role via full stack", async () => {
    // 1. Setup Infrastructure
    const roleRepository = createKVRoleRepositoryAdapter(kvPool);

    // 2. Setup Application
    const createRole = createCreateRole({
      roleRepository,
      obs: { audit: () => {} }, // Mock observer
      eventBus: { publish: () => {} } // Mock event bus
    });
    const getRole = createGetRole({ roleRepository });

    // 3. Execution
    const tenantId = "test-tenant-integration-ac";
    const roleInput = {
      name: "Admin Role",
      permissions: ["READ_ALL", "WRITE_ALL"]
    };

    // Create
    const createResult = await createRole.execute(tenantId, roleInput);
    assert(createResult.ok, "Create Role should be successful");
    const createdRole = createResult.value;
    assertEquals(createdRole.name, roleInput.name);
    assertEquals(createdRole.permissions, roleInput.permissions);

    // Retrieve
    const getResult = await getRole.execute(tenantId, createdRole.id);
    assert(getResult.ok, "Get Role should be successful");
    const retrievedRole = getResult.value;

    // Verify
    assertEquals(retrievedRole.id, createdRole.id);
    assertEquals(retrievedRole.name, roleInput.name);
  });

  await kvPool.close();
});
