import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createGetRole } from "./get-role.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - Get Role", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should get role successfully", async () => {
    const mockRole = { id: "role-1", name: "Admin" };
    const roleRepository = {
      findById: (tid, id) => Promise.resolve(Ok(mockRole)),
    };

    const useCase = createGetRole({ roleRepository });

    const result = await useCase.execute(tenantId, "role-1");

    assert(result.ok);
    assertEquals(result.value.id, "role-1");
  });

  await t.step("should return error if role not found (assuming repository returns error)", async () => {
    const roleRepository = {
      findById: (tid, id) => Promise.resolve(Err({ code: "NOT_FOUND" })),
    };

    const useCase = createGetRole({ roleRepository });

    const result = await useCase.execute(tenantId, "role-1");

    assert(!result.ok);
    assertEquals(result.error.code, "NOT_FOUND");
  });
});
