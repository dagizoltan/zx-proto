import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createFindUsersByRole } from "./find-users-by-role.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - Find Users By Role", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should find users by role", async () => {
    const mockUsers = { items: [{ id: "user-1", roleIds: ["role-1"] }] };
    const userRepository = {
      queryByIndex: (tid, index, value, opts) => {
          assertEquals(index, "roleIds");
          assertEquals(value, "role-1");
          return Promise.resolve(Ok(mockUsers));
      }
    };

    const useCase = createFindUsersByRole({ userRepository });

    const result = await useCase.execute(tenantId, "role-1");

    assert(result.ok);
    assertEquals(result.value.items.length, 1);
  });
});
