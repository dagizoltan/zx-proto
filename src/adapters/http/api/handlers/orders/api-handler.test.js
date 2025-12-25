
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createOrderHandler } from "./create-order.handler.js";

// Mock Context for Hono
const createMockContext = (overrides = {}) => {
    return {
        get: (key) => {
            if (key === 'user') return { id: 'u1' };
            if (key === 'tenantId') return 't1';
            if (key === 'validatedData') return { items: [{ id: 'p1', qty: 1 }] };
            return overrides[key];
        },
        ctx: {
            get: (key) => {
                if (key === 'domain.orders') return overrides.ordersContext;
                return null;
            }
        },
        json: (data, status) => ({ data, status })
    };
};

Deno.test("API Handler - Create Order (Async 202)", async () => {
    // Mock Orders Context Use Case
    const mockCreateOrder = {
        execute: async (tenantId, orderData) => {
            assertEquals(tenantId, 't1');
            assertEquals(orderData.customerId, 'u1');
            assertEquals(orderData.items.length, 1);
            return { id: 'ord-123', status: 'PENDING', message: 'Processing' };
        }
    };

    const mockOrdersContext = {
        useCases: {
            createOrder: mockCreateOrder
        }
    };

    const c = createMockContext({ ordersContext: mockOrdersContext });
    const response = await createOrderHandler(c);

    assertEquals(response.status, 202);
    assertEquals(response.data.id, 'ord-123');
    assertEquals(response.data.status, 'PENDING');
});
