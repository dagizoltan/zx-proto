import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createCreatePriceList } from "./create-price-list.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Catalog - Create Price List", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should create price list successfully", async () => {
    // Mocks
    const priceListRepository = {
      save: (tid, list) => Promise.resolve(Ok(list)),
    };

    const useCase = createCreatePriceList({ priceListRepository });
    const input = {
      name: "VIP Prices",
      currency: "USD",
      prices: [
          { productId: crypto.randomUUID(), price: 100 }
      ]
    };

    const result = await useCase.execute(tenantId, input);

    assert(result.ok);
    assertEquals(result.value.name, "VIP Prices");
  });

  await t.step("should validate input (fail empty name)", async () => {
    const priceListRepository = {};
    const useCase = createCreatePriceList({ priceListRepository });

    const result = await useCase.execute(tenantId, { name: "" });

    assert(!result.ok);
    assertEquals(result.error.code, "VALIDATION_ERROR");
  });
});
