import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createGetCategory } from "./get-category.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Catalog - Get Category", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should get category successfully", async () => {
    const mockCat = { id: "cat-1", name: "Electronics" };
    const categoryRepository = {
      findById: (tid, id) => Promise.resolve(Ok(mockCat)),
    };

    const useCase = createGetCategory({ categoryRepository });

    const result = await useCase.execute(tenantId, "cat-1");

    assert(result.ok);
    assertEquals(result.value.id, "cat-1");
  });
});
