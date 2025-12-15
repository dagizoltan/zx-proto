import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createCheckPermission } from "./check-permission.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - Check Permission", async (t) => {
  const tenantId = "test-tenant";
  const mockUser = {
      id: "user-1",
      roleIds: ["role-1"]
  };
  // Adjusted mockRole based on rbac-service.js structure
  const mockRole = {
      id: "role-1",
      name: "Admin",
      permissions: [
          { resource: "orders", actions: ["read", "write"] }
      ]
  };

  await t.step("should allow if permission exists", async () => {
    // Mocks
    const userRepository = {
      findById: () => Promise.resolve(Ok(mockUser)),
    };
    const roleRepository = {
      findByIds: () => Promise.resolve(Ok([mockRole])),
    };

    const useCase = createCheckPermission({ userRepository, roleRepository });

    const result = await useCase.execute(tenantId, "user-1", "orders", "read");

    assert(result.ok);
    assertEquals(result.value, true);
  });

  await t.step("should deny if permission does not exist", async () => {
      // Mocks
    const userRepository = {
      findById: () => Promise.resolve(Ok(mockUser)),
    };
    const roleRepository = {
      findByIds: () => Promise.resolve(Ok([mockRole])),
    };

    const useCase = createCheckPermission({ userRepository, roleRepository });

    const result = await useCase.execute(tenantId, "user-1", "orders", "delete");

    assert(result.ok);
    assertEquals(result.value, false);
  });

  await t.step("should deny if user has no roles", async () => {
    // Mocks
    const userNoRoles = { ...mockUser, roleIds: [] };
    const userRepository = {
      findById: () => Promise.resolve(Ok(userNoRoles)),
    };
    const roleRepository = {
      findByIds: () => Promise.resolve(Ok([])),
    };

    const useCase = createCheckPermission({ userRepository, roleRepository });

    const result = await useCase.execute(tenantId, "user-1", "orders", "read");

    assert(result.ok);
    assertEquals(result.value, false);
  });
});
