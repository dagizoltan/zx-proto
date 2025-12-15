import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createGetPriceList } from "./get-price-list.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Catalog - Get Price List", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should get price list successfully", async () => {
    const mockList = { id: "list-1", name: "VIP" };
    const priceListRepository = {
      findById: (tid, id) => Promise.resolve(Ok(mockList)),
    };

    const useCase = createGetPriceList({ priceListRepository });

    const result = await useCase.execute(tenantId, "list-1");

    assert(result.ok);
    assertEquals(result.value.id, "list-1");
  });
});
