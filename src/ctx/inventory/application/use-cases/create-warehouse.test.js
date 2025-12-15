import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createCreateWarehouse } from "./create-warehouse.js";

Deno.test("Inventory - Create Warehouse", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should create warehouse", async () => {
    const warehouseRepository = {
      save: (tid, wh) => Promise.resolve(wh),
    };
    const eventBus = { publish: () => Promise.resolve() };

    const useCase = createCreateWarehouse({ warehouseRepository, eventBus });
    const result = await useCase.execute(tenantId, { name: "Main WH", location: "NYC", code: "WH-001" });

    assertEquals(result.name, "Main WH");
    assertEquals(result.code, "WH-001");
  });
});
