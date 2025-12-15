import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createTestKvPool } from "../../../test-utils/kv-pool.js";
import { createKVOrderRepositoryAdapter } from "../infrastructure/adapters/kv-order-repository.adapter.js";
import { createCreateOrder } from "../application/use-cases/create-order.js";
import { Ok, Err } from "../../../../lib/trust/index.js";

// Mock Gateways
const createMockCatalogGateway = () => ({
  getProducts: (tenantId, productIds) => {
    // Return dummy products for any requested ID
    return Promise.resolve(Ok(productIds.map(id => ({
      id,
      name: `Product ${id}`,
      price: 100
    }))));
  }
});

const createMockInventoryGateway = () => ({
  reserveStock: (tenantId, items, orderId) => Promise.resolve(Ok(true)),
  releaseStock: (tenantId, orderId) => Promise.resolve(Ok(true))
});

const createMockCustomerGateway = () => ({
  getCustomer: (tenantId, userId) => Promise.resolve(Ok({ id: userId, name: "Test User" }))
});

Deno.test("Orders Context - Integration Test", async (t) => {
  const kvPool = await createTestKvPool();

  await t.step("should create and retrieve an order via full stack (with mocked gateways)", async () => {
    // 1. Setup Infrastructure
    const orderRepository = createKVOrderRepositoryAdapter(kvPool);
    const catalogGateway = createMockCatalogGateway();
    const inventoryGateway = createMockInventoryGateway();
    const customerGateway = createMockCustomerGateway();

    // 2. Setup Application
    const createOrder = createCreateOrder({
      orderRepository,
      catalogGateway,
      inventoryGateway,
      customerGateway,
      obs: { audit: () => {}, error: () => {} }, // Simple mock observer
      eventBus: { publish: () => {} } // Simple mock event bus
    });

    // 3. Execution
    const tenantId = "test-tenant-integration-orders";
    const userId = "user-123";
    const items = [
      { productId: "prod-1", quantity: 2 },
      { productId: "prod-2", quantity: 1 }
    ];

    // Create
    const createResult = await createOrder.execute(tenantId, userId, items);
    assert(createResult.ok, "Create Order should be successful");
    const createdOrder = createResult.value;

    // Verify creation
    assertEquals(createdOrder.customerId, userId);
    assertEquals(createdOrder.status, "CREATED");
    assertEquals(createdOrder.items.length, 2);
    assertEquals(createdOrder.totalAmount, 300); // (100 * 2) + (100 * 1)

    // Retrieve (Directly from Repository to verify persistence)
    const getResult = await orderRepository.findById(tenantId, createdOrder.id);
    assert(getResult.ok, "Get Order should be successful");
    const retrievedOrder = getResult.value;

    // Verify retrieval
    assertEquals(retrievedOrder.id, createdOrder.id);
    assertEquals(retrievedOrder.customerId, userId);
    assertEquals(retrievedOrder.totalAmount, 300);
  });

  await kvPool.close();
});
