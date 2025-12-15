import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createGetUser } from "./get-user.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - Get User", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should return user if found", async () => {
    const mockUser = { id: "user-1", name: "Test User" };
    const userRepositoryValueReturn = {
        findById: () => Promise.resolve(mockUser) // Based on implementation finding
    };

    const useCase = createGetUser({ userRepository: userRepositoryValueReturn });
    const result = await useCase.execute(tenantId, "user-1");

    assert(result.ok);
    assertEquals(result.value.id, "user-1");
  });

  await t.step("should return error if user not found", async () => {
     const userRepositoryValueReturn = {
        findById: () => Promise.resolve(null)
    };

    const useCase = createGetUser({ userRepository: userRepositoryValueReturn });
    const result = await useCase.execute(tenantId, "user-1");

    assert(!result.ok);
    assertEquals(result.error.code, 'USER_NOT_FOUND');
  });
});
