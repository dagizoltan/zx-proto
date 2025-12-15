import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createLoginUser } from "./login-user.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - Login User", async (t) => {
  const tenantId = "test-tenant";
  const testUser = {
    id: "user-1",
    email: "test@example.com",
    passwordHash: "hashed_password",
    roleIds: ["role-1"],
  };

  await t.step("should login successfully with valid credentials", async () => {
    // Mocks
    const userRepository = {
      findByEmail: () => Promise.resolve(Ok(testUser)),
    };
    const authService = {
      verifyPassword: (pwd, hash) => Promise.resolve(pwd === "password" && hash === "hashed_password"),
      generateToken: () => Promise.resolve("valid-token"),
    };

    const useCase = createLoginUser({ userRepository, authService });

    const result = await useCase.execute(tenantId, "test@example.com", "password");

    assert(result.ok);
    assertEquals(result.value.token, "valid-token");
    assertEquals(result.value.user.id, testUser.id);
  });

  await t.step("should fail with invalid password", async () => {
    // Mocks
    const userRepository = {
      findByEmail: () => Promise.resolve(Ok(testUser)),
    };
    const authService = {
      verifyPassword: () => Promise.resolve(false),
      generateToken: () => Promise.resolve("token"),
    };

    const useCase = createLoginUser({ userRepository, authService });

    const result = await useCase.execute(tenantId, "test@example.com", "wrong-password");

    assert(!result.ok);
    assertEquals(result.error.code, "AUTH_FAILED");
  });

  await t.step("should fail if user not found", async () => {
    // Mocks
    const userRepository = {
      findByEmail: () => Promise.resolve(Ok(null)),
    };
    const authService = {
        verifyPassword: () => Promise.resolve(true),
    }

    const useCase = createLoginUser({ userRepository, authService });

    const result = await useCase.execute(tenantId, "non-existent@example.com", "password");

    assert(!result.ok);
    assertEquals(result.error.code, "AUTH_FAILED");
  });
});
