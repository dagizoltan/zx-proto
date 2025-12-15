import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createListOrders } from "./list-orders.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Orders - List Orders", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should list orders with filters", async () => {
    const mockOrders = { items: [{ id: "o-1" }] };
    const orderRepository = {
      query: (tid, params) => {
          assertEquals(params.filter.status, "CREATED");
          assertEquals(params.filter.customer, "c-1");
          return Promise.resolve(Ok(mockOrders));
      },
    };

    const useCase = createListOrders({ orderRepository });
    const result = await useCase.execute(tenantId, { status: "CREATED", customerId: "c-1" });

    assert(result.ok);
    assertEquals(result.value.items.length, 1);
  });
});
