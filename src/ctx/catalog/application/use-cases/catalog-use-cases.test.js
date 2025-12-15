import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createListProducts, createSearchProducts, createFilterByCategory } from "./catalog-use-cases.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Catalog - Catalog Use Cases", async (t) => {
  const tenantId = "test-tenant";
  const mockProducts = { items: [{ id: "p-1", name: "Widget" }] };

  await t.step("createListProducts should query products", async () => {
    const productRepository = {
      query: (tid, params, opts) => {
          // Verify resolvers passed
          assert(opts.resolvers.category);
          return Promise.resolve(Ok(mockProducts));
      }
    };
    const categoryRepository = {
        findByIds: () => Promise.resolve(Ok([]))
    };

    const useCase = createListProducts({ productRepository, categoryRepository });
    const result = await useCase.execute(tenantId, { limit: 10 });

    assert(result.ok);
    assertEquals(result.value.items[0].id, "p-1");
  });

  await t.step("createSearchProducts should search products", async () => {
     const productRepository = {
      query: (tid, params, opts) => {
          assertEquals(params.searchFields, ['name', 'sku', 'description']);
          assertEquals(params.filter.search, "widget");
          return Promise.resolve(Ok(mockProducts));
      }
    };

    const useCase = createSearchProducts({ productRepository });
    const result = await useCase.execute(tenantId, "widget");

    assert(result.ok);
    assertEquals(result.value[0].id, "p-1");
  });

  await t.step("createFilterByCategory should filter by category", async () => {
    const productRepository = {
      query: (tid, params, opts) => {
          assertEquals(params.filter.category, "cat-1");
          return Promise.resolve(Ok(mockProducts));
      }
    };

    const useCase = createFilterByCategory({ productRepository });
    const result = await useCase.execute(tenantId, "cat-1");

    assert(result.ok);
    assertEquals(result.value[0].id, "p-1");
  });
});
