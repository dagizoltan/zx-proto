import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createUpdateOrderStatus } from "./update-order-status.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Orders - Update Order Status", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should update status successfully", async () => {
    // Mocks
    const mockOrder = { id: "o-1", status: "CREATED" };
    const orderRepository = {
      findById: () => Promise.resolve(Ok(mockOrder)),
      save: (tid, order) => Promise.resolve(Ok(order)),
    };
    const inventoryGateway = {};
    const obs = { info: () => {} };
    const eventBus = { publish: () => Promise.resolve() };

    const useCase = createUpdateOrderStatus({ orderRepository, inventoryGateway, obs, eventBus });
    const result = await useCase.execute(tenantId, "o-1", "PAID");

    assert(result.ok);
    assertEquals(result.value.status, "PAID");
  });

  await t.step("should fail invalid transition", async () => {
     const mockOrder = { id: "o-1", status: "CREATED" };
    const orderRepository = {
      findById: () => Promise.resolve(Ok(mockOrder)),
    };
    const useCase = createUpdateOrderStatus({ orderRepository });

    const result = await useCase.execute(tenantId, "o-1", "SHIPPED"); // Cannot jump from CREATED to SHIPPED

    assert(!result.ok);
    assertEquals(result.error.code, "INVALID_TRANSITION");
  });

   await t.step("should trigger side effects (CANCELLED -> releaseStock)", async () => {
    const mockOrder = { id: "o-1", status: "CREATED" };
    const orderRepository = {
      findById: () => Promise.resolve(Ok(mockOrder)),
      save: (tid, order) => Promise.resolve(Ok(order)),
    };
    let stockReleased = false;
    const inventoryGateway = {
        releaseStock: () => {
            stockReleased = true;
            return Promise.resolve(Ok());
        }
    };

    const useCase = createUpdateOrderStatus({ orderRepository, inventoryGateway });
    const result = await useCase.execute(tenantId, "o-1", "CANCELLED");

    assert(result.ok);
    assert(stockReleased);
  });
});
