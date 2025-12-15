import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createGetUsersBatch } from "./get-users-batch.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - Get Users Batch", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should get users batch successfully", async () => {
    const mockUsers = [{ id: "user-1" }, { id: "user-2" }];
    const userRepository = {
      findByIds: (tid, ids) => Promise.resolve(Ok(mockUsers)),
    };

    const useCase = createGetUsersBatch({ userRepository });

    const result = await useCase.execute(tenantId, ["user-1", "user-2"]);

    assert(result.ok);
    assertEquals(result.value.length, 2);
  });
});
