import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createListShipments } from "./list-shipments.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Orders - List Shipments", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should list all shipments", async () => {
    const mockRes = { items: [] };
    const shipmentRepository = {
      list: () => Promise.resolve(Ok(mockRes)),
    };
    const useCase = createListShipments({ shipmentRepository });
    const result = await useCase.execute(tenantId);
    assert(result.ok);
  });

  await t.step("should list shipments by orderId", async () => {
    const mockRes = { items: [{ id: "s-1", orderId: "o-1" }] };
    const shipmentRepository = {
      queryByIndex: (tid, idx, val) => {
          assertEquals(idx, "orderId");
          assertEquals(val, "o-1");
          return Promise.resolve(Ok(mockRes));
      },
    };
    const useCase = createListShipments({ shipmentRepository });
    const result = await useCase.execute(tenantId, { orderId: "o-1" });
    assert(result.ok);
    assertEquals(result.value.items.length, 1);
  });
});
