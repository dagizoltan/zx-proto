import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createCreateProduct } from "./create-product.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Catalog - Create Product", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should create product successfully", async () => {
    // Mocks
    const productRepository = {
      save: (tid, prod) => Promise.resolve(Ok(prod)),
    };
    const categoryRepository = {
      findById: (tid, id) => Promise.resolve(Ok({ id })),
    };
    const eventBus = { publish: () => Promise.resolve() };

    const useCase = createCreateProduct({ productRepository, categoryRepository, eventBus });
    const input = {
      name: "Smartphone",
      sku: "PHONE-001",
      price: 500,
      categoryId: "cat-1",
      type: "SIMPLE"
    };

    const result = await useCase.execute(tenantId, input);

    assert(result.ok);
    assertEquals(result.value.name, "Smartphone");
    assertEquals(result.value.sku, "PHONE-001");
  });

  await t.step("should fail if category not found", async () => {
      // Mocks
    const productRepository = {};
    const categoryRepository = {
      findById: () => Promise.resolve(Err({ code: "NOT_FOUND" })),
    };

    const useCase = createCreateProduct({ productRepository, categoryRepository });
    const input = {
      name: "Smartphone",
      sku: "PHONE-001",
      price: 500,
      categoryId: "cat-missing",
      type: "SIMPLE"
    };

    const result = await useCase.execute(tenantId, input);

    assert(!result.ok);
    assertEquals(result.error.code, "VALIDATION_ERROR");
  });
});
