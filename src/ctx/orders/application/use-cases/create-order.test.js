import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createCreateOrder } from "./create-order.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Orders - Create Order", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should create order successfully", async () => {
    // Mocks
    const customerGateway = {
      getCustomer: (tid, uid) => Promise.resolve(Ok({ id: uid, name: "Customer" })),
    };
    const catalogGateway = {
      getProducts: (tid, ids) => Promise.resolve(Ok([
          { id: "p-1", price: 100, name: "Product 1" }
      ])),
    };
    const inventoryGateway = {
      reserveStock: () => Promise.resolve(Ok({ reservationId: "res-1" })),
      releaseStock: () => Promise.resolve(Ok()),
    };
    const orderRepository = {
      save: (tid, order) => Promise.resolve(Ok(order)),
    };
    const obs = { audit: () => {} };
    const eventBus = { publish: () => Promise.resolve() };

    const useCase = createCreateOrder({
      customerGateway,
      catalogGateway,
      inventoryGateway,
      orderRepository,
      obs,
      eventBus
    });

    const items = [{ productId: "p-1", quantity: 2 }];
    const result = await useCase.execute(tenantId, "user-1", items);

    assert(result.ok);
    assertEquals(result.value.totalAmount, 200); // 100 * 2
    assertEquals(result.value.items[0].productName, "Product 1"); // Enriched
  });

  await t.step("should fail if customer invalid", async () => {
    const customerGateway = {
      getCustomer: () => Promise.resolve(Err({ code: "NOT_FOUND" })),
    };
    const useCase = createCreateOrder({ customerGateway });

    const result = await useCase.execute(tenantId, "user-1", []);
    assert(!result.ok);
    assertEquals(result.error.code, "INVALID_CUSTOMER");
  });

  await t.step("should fail if product not found", async () => {
     const customerGateway = {
      getCustomer: (tid, uid) => Promise.resolve(Ok({ id: uid })),
    };
    const catalogGateway = {
      getProducts: () => Promise.resolve(Ok([])), // No products returned
    };

    const useCase = createCreateOrder({ customerGateway, catalogGateway });

    const items = [{ productId: "p-1", quantity: 1 }];
    const result = await useCase.execute(tenantId, "user-1", items);

    assert(!result.ok);
    assertEquals(result.error.code, "PRODUCT_NOT_FOUND");
  });

  await t.step("should rollback stock if save fails", async () => {
     const customerGateway = {
      getCustomer: (tid, uid) => Promise.resolve(Ok({ id: uid })),
    };
    const catalogGateway = {
      getProducts: (tid, ids) => Promise.resolve(Ok([
          { id: "p-1", price: 100, name: "Product 1" }
      ])),
    };
    let released = false;
    const inventoryGateway = {
      reserveStock: () => Promise.resolve(Ok({ reservationId: "res-1" })),
      releaseStock: () => {
          released = true;
          return Promise.resolve(Ok());
      },
    };
    const orderRepository = {
      save: () => Promise.resolve(Err({ code: "DB_ERROR" })),
    };

    const useCase = createCreateOrder({
      customerGateway,
      catalogGateway,
      inventoryGateway,
      orderRepository,
      obs: { error: () => {} }
    });

    const items = [{ productId: "p-1", quantity: 1 }];
    const result = await useCase.execute(tenantId, "user-1", items);

    assert(!result.ok);
    assert(released, "Stock should be released");
  });
});
