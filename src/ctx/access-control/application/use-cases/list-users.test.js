import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createListUsers } from "./list-users.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - List Users", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should list users successfully", async () => {
    // Mocks
    const mockUsers = {
        items: [{ id: "user-1" }, { id: "user-2" }],
        cursor: "next-cursor"
    };

    const userRepository = {
      list: (tid, params) => {
          assertEquals(tid, tenantId);
          assertEquals(params.limit, 10);
          return Promise.resolve(Ok(mockUsers));
      },
    };

    const useCase = createListUsers({ userRepository });

    const result = await useCase.execute(tenantId, { limit: 10 });

    assert(result.ok);
    assertEquals(result.value.items.length, 2);
    assertEquals(result.value.cursor, "next-cursor");
  });
});
