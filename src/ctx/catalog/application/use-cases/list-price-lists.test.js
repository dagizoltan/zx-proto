import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createListPriceLists } from "./list-price-lists.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Catalog - List Price Lists", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should list price lists", async () => {
    const mockLists = { items: [{ id: "pl-1" }] };
    const priceListRepository = {
      list: (tid, params) => Promise.resolve(Ok(mockLists)),
    };

    const useCase = createListPriceLists({ priceListRepository });

    const result = await useCase.execute(tenantId);

    assert(result.ok);
    assertEquals(result.value.items.length, 1);
  });
});
