import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createAssignRoleToUser } from "./assign-role.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - Assign Role to User", async (t) => {
  const tenantId = "test-tenant";
  const mockUser = {
      id: "user-1",
      email: "test@example.com",
      passwordHash: "hash",
      roleIds: [],
      name: "Test User"
  };
  const mockRole = { id: "role-1", name: "Admin", permissions: [] };

  await t.step("should assign role successfully", async () => {
    // Mocks
    const userRepository = {
      findById: (tid, uid) => Promise.resolve(Ok(mockUser)),
      save: (tid, user) => Promise.resolve(Ok(user)),
    };
    const roleRepository = {
      findByIds: (tid, ids) => Promise.resolve(Ok([mockRole])),
    };
    const obs = { audit: () => {} };

    const useCase = createAssignRoleToUser({ userRepository, roleRepository, obs });

    const result = await useCase.execute(tenantId, { userId: "user-1", roleIds: ["role-1"] });

    assert(result.ok);
    assertEquals(result.value.roleIds, ["role-1"]);
  });

  await t.step("should fail if user not found", async () => {
    // Mocks
    const userRepository = {
      findById: () => Promise.resolve(Ok(null)),
    };
    const roleRepository = {};

    const useCase = createAssignRoleToUser({ userRepository, roleRepository });

    const result = await useCase.execute(tenantId, { userId: "user-1", roleIds: ["role-1"] });

    assert(!result.ok);
    assertEquals(result.error.code, "USER_NOT_FOUND");
  });

  await t.step("should fail if roles not found", async () => {
    // Mocks
    const userRepository = {
      findById: () => Promise.resolve(Ok(mockUser)),
    };
    const roleRepository = {
        findByIds: () => Promise.resolve(Ok([])), // No roles found
    };

    const useCase = createAssignRoleToUser({ userRepository, roleRepository });

    const result = await useCase.execute(tenantId, { userId: "user-1", roleIds: ["role-1"] });

    assert(!result.ok);
    assertEquals(result.error.code, "ROLE_NOT_FOUND");
  });
});
