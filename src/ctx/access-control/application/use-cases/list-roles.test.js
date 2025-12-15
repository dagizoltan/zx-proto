import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createListRoles } from "./list-roles.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - List Roles", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should list roles successfully", async () => {
    // Mocks
    const mockRoles = {
        items: [{ id: "role-1", name: "Admin" }],
    };

    const roleRepository = {
      list: (tid, params) => {
          assertEquals(tid, tenantId);
          return Promise.resolve(Ok(mockRoles));
      },
    };

    const useCase = createListRoles({ roleRepository });

    const result = await useCase.execute(tenantId);

    assert(result.ok);
    assertEquals(result.value.length, 1);
    assertEquals(result.value[0].name, "Admin");
  });
});
