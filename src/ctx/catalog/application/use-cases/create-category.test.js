import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createCreateCategory } from "./create-category.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Catalog - Create Category", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should create category successfully", async () => {
    const categoryRepository = {
      save: (tid, cat) => Promise.resolve(Ok(cat)),
    };

    const useCase = createCreateCategory({ categoryRepository });
    const input = { name: "Electronics", description: "Gadgets" };

    const result = await useCase.execute(tenantId, input);

    assert(result.ok);
    assertEquals(result.value.name, "Electronics");
  });
});
