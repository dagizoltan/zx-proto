import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createGetProduct } from "./get-product.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Catalog - Get Product", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should get product with pricing", async () => {
    const mockProduct = { id: "p-1", price: 100, name: "Widget" };
    const productRepository = {
      findById: (tid, id) => Promise.resolve(Ok(mockProduct)),
    };
    const pricingService = {
      calculatePrice: (prod, qty, group) => ({ price: 90, appliedRule: "10% OFF" }),
    };

    const useCase = createGetProduct({ productRepository, pricingService });

    const result = await useCase.execute(tenantId, "p-1", { quantity: 5 });

    assert(result.ok);
    assertEquals(result.value.id, "p-1");
    assertEquals(result.value.finalPrice, 90);
    assertEquals(result.value.appliedRule, "10% OFF");
  });

  await t.step("should return error if not found", async () => {
     const productRepository = {
      findById: () => Promise.resolve(Ok(null)),
    };
    const pricingService = {};

    const useCase = createGetProduct({ productRepository, pricingService });

    const result = await useCase.execute(tenantId, "p-1");

    assert(!result.ok);
    assertEquals(result.error.code, "NOT_FOUND");
  });
});
