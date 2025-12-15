import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createListWarehouses } from "./list-warehouses.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Inventory - List Warehouses", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should list warehouses", async () => {
    const mockRes = { items: [{ name: "Main WH" }] };
    const warehouseRepository = {
      list: () => Promise.resolve(Ok(mockRes)),
    };
    const useCase = createListWarehouses({ warehouseRepository });
    const result = await useCase.execute(tenantId);
    assert(result.ok);
    assertEquals(result.value.items.length, 1);
  });
});
