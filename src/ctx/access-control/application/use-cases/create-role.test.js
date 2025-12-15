import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createCreateRole } from "./create-role.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - Create Role", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should create role successfully", async () => {
    // Mocks
    const roleRepository = {
      save: (tid, role) => Promise.resolve(Ok(role)),
    };
    const obs = { audit: () => {} };
    const eventBus = { publish: () => Promise.resolve() };

    const useCase = createCreateRole({ roleRepository, obs, eventBus });

    const input = {
      name: "Admin",
      permissions: ["read:users", "write:users"],
    };

    const result = await useCase.execute(tenantId, input);

    assert(result.ok);
    assertEquals(result.value.name, input.name);
    assertEquals(result.value.permissions.length, 2);
  });

  await t.step("should handle repository errors", async () => {
     // Mocks
    const roleRepository = {
      save: () => Promise.resolve(Err({ code: "DB_ERROR" })),
    };

    const useCase = createCreateRole({ roleRepository });

    const input = {
      name: "Admin",
      permissions: [],
    };

    const result = await useCase.execute(tenantId, input);

    assert(!result.ok);
    assertEquals(result.error.code, "DB_ERROR");
  });
});
