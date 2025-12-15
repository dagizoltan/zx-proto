import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createRegisterUser } from "./register-user.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Access Control - Register User", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should register a new user successfully", async () => {
    // Mocks
    const userRepository = {
      findByEmail: () => Promise.resolve(Ok(null)),
      save: (tid, user) => Promise.resolve(Ok(user)),
    };
    const authService = {
      hashPassword: (pwd) => Promise.resolve(`hashed_${pwd}`),
    };
    const obs = {
      audit: () => {},
    };
    const eventBus = {
      publish: () => Promise.resolve(),
    };

    const useCase = createRegisterUser({
      userRepository,
      authService,
      obs,
      eventBus,
    });

    const input = {
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    };

    const result = await useCase.execute(tenantId, input);

    assert(result.ok);
    assertEquals(result.value.email, input.email);
    assertEquals(result.value.name, input.name);
    assertEquals(result.value.passwordHash, "hashed_password123");
  });

  await t.step("should return error if user already exists", async () => {
    // Mocks
    const userRepository = {
      findByEmail: () => Promise.resolve(Ok({ id: "existing-id" })),
      save: () => Promise.resolve(Err({ code: "SHOULD_NOT_CALL" })),
    };
    const authService = {
      hashPassword: (pwd) => Promise.resolve(`hashed_${pwd}`),
    };

    const useCase = createRegisterUser({ userRepository, authService });

    const input = {
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    };

    const result = await useCase.execute(tenantId, input);

    assert(!result.ok);
    assertEquals(result.error.code, "CONFLICT");
  });

  await t.step("should handle validation errors", async () => {
    // Mocks
    const userRepository = {
        findByEmail: () => Promise.resolve(Ok(null)),
    };
    const authService = {
        hashPassword: (pwd) => Promise.resolve(`hashed_${pwd}`),
    };

    const useCase = createRegisterUser({ userRepository, authService });

    const input = {
      email: "invalid-email",
      password: "short",
      name: "",
    };

    const result = await useCase.execute(tenantId, input);

    assert(!result.ok);
  });
});
