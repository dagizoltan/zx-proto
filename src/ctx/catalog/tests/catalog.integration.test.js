import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createTestKvPool } from "../../../test-utils/kv-pool.js";
import { createKVCategoryRepositoryAdapter } from "../infrastructure/adapters/kv-category-repository.adapter.js";
import { createCreateCategory } from "../application/use-cases/create-category.js";
import { createGetCategory } from "../application/use-cases/get-category.js";

Deno.test("Catalog Context - Integration Test", async (t) => {
  const kvPool = await createTestKvPool();

  await t.step("should create and retrieve a category via full stack", async () => {
    // 1. Setup Infrastructure
    const categoryRepository = createKVCategoryRepositoryAdapter(kvPool);

    // 2. Setup Application
    const createCategory = createCreateCategory({ categoryRepository });
    const getCategory = createGetCategory({ categoryRepository });

    // 3. Execution
    const tenantId = "test-tenant-integration";
    const categoryInput = {
      name: "Integration Test Category",
      description: "Testing the full flow"
    };

    // Create
    const createResult = await createCategory.execute(tenantId, categoryInput);
    assert(createResult.ok, "Create Category should be successful");
    const createdCategory = createResult.value;
    assertEquals(createdCategory.name, categoryInput.name);
    assert(createdCategory.id, "Created category should have an ID");

    // Retrieve
    const getResult = await getCategory.execute(tenantId, createdCategory.id);
    assert(getResult.ok, "Get Category should be successful");
    const retrievedCategory = getResult.value;

    // Verify
    assertEquals(retrievedCategory.id, createdCategory.id);
    assertEquals(retrievedCategory.name, categoryInput.name);
    assertEquals(retrievedCategory.description, categoryInput.description);
  });

  await kvPool.close();
});
