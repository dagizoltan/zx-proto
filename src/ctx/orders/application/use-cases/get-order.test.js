import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createGetOrder } from "./get-order.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Orders - Get Order", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should get order", async () => {
    const mockOrder = { id: "o-1", totalAmount: 100 };
    const orderRepository = {
      findById: (tid, id) => Promise.resolve(Ok(mockOrder)),
    };

    const useCase = createGetOrder({ orderRepository });
    const result = await useCase.execute(tenantId, "o-1");

    assert(result.ok);
    assertEquals(result.value.id, "o-1");
  });
});
