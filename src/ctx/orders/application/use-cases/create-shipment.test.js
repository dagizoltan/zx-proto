import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createCreateShipment } from "./create-shipment.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Orders - Create Shipment", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should create shipment and update order status to SHIPPED", async () => {
    // Mocks
    const mockOrder = {
        id: "o-1",
        items: [{ productId: "p-1", quantity: 2 }],
        status: "PAID"
    };

    const orderRepository = {
      findById: () => Promise.resolve(Ok(mockOrder)),
      save: (tid, order) => {
          assertEquals(order.status, "SHIPPED");
          return Promise.resolve(Ok(order));
      },
    };

    const shipmentRepository = {
      save: (tid, s) => Promise.resolve(Ok(s)),
      queryByIndex: () => Promise.resolve(Ok({ items: [] })) // Empty previously shipped
    };

    const inventoryGateway = {
        confirmShipment: () => Promise.resolve(Ok())
    };
    const eventBus = { publish: () => Promise.resolve() };

    const useCase = createCreateShipment({ shipmentRepository, orderRepository, inventoryGateway, eventBus });

    const input = {
        orderId: "o-1",
        items: [{ productId: "p-1", quantity: 2 }]
    };

    const result = await useCase.execute(tenantId, input);

    assert(result.ok);
    assertEquals(result.value.items[0].quantity, 2);
  });

  await t.step("should set PARTIALLY_SHIPPED", async () => {
    const mockOrder = {
        id: "o-1",
        items: [{ productId: "p-1", quantity: 2 }],
        status: "PAID"
    };

    const orderRepository = {
      findById: () => Promise.resolve(Ok(mockOrder)),
      save: (tid, order) => {
          assertEquals(order.status, "PARTIALLY_SHIPPED");
          return Promise.resolve(Ok(order));
      },
    };
    const shipmentRepository = {
      save: (tid, s) => Promise.resolve(Ok(s)),
      queryByIndex: () => Promise.resolve(Ok({ items: [] }))
    };
    const inventoryGateway = { confirmShipment: () => Promise.resolve(Ok()) };

    const useCase = createCreateShipment({ shipmentRepository, orderRepository, inventoryGateway });

    const input = {
        orderId: "o-1",
        items: [{ productId: "p-1", quantity: 1 }] // Only 1 of 2
    };

    const result = await useCase.execute(tenantId, input);
    assert(result.ok);
  });
});
