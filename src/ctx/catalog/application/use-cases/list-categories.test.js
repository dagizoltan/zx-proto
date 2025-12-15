import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createListCategories } from "./list-categories.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Catalog - List Categories", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should list categories", async () => {
    const mockCats = { items: [{ id: "cat-1" }, { id: "cat-2" }] };
    const categoryRepository = {
      list: (tid, params) => Promise.resolve(Ok(mockCats)),
    };

    const useCase = createListCategories({ categoryRepository });

    const result = await useCase.execute(tenantId, { limit: 10 });

    assert(result.ok);
    assertEquals(result.value.items.length, 2);
  });
});
