import { unwrap } from '../../../../../../lib/trust/index.js';

export const createOrderHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');

    const data = c.get('validatedData');

    // We pass validated data directly.
    // The use case signature in src/ctx/orders/index.js is: execute(tenantId, orderData)
    // orderData = { customerId, items }

    // Note: Use case handles 'customerId' from second arg? No, see createOrder in src/ctx/orders/index.js
    // execute: async (tenantId, orderData) => ... payload: { customerId: orderData.customerId, ... }

    // Current handler passes: (tenantId, user.id, items) which mismatches the new signature!
    // The previous use case create-order.js signature was `execute(tenantId, userId, items)`.
    // The new one in src/ctx/orders/index.js is `execute(tenantId, orderData)`.

    // FIX: Match the new signature.
    const orderData = {
        customerId: user.id,
        items: data.items
    };

    // New Use Case returns { id, status: 'PENDING', message: ... } (Async)
    // It is NOT a Result<T> type in the new pure logic?
    // Wait, createOrder in `src/ctx/orders/index.js` returns a plain object:
    // return { id: orderId, status: 'PENDING', message: 'Order processing started' };
    // So `unwrap` will fail if it expects a Result object (Ok/Err).

    // We need to check if `createOrder` returns a Result or Promise<T>.
    // In `src/ctx/orders/index.js`:
    // const createOrder = { execute: async ... return { ... } }
    // It does NOT wrap in Ok/Err.

    const result = await orders.useCases.createOrder.execute(tenantId, orderData);

    return c.json({
        id: result.id,
        status: result.status,
        message: result.message,
        links: {
            self: `/api/orders/${result.id}`
        }
    }, 202);
};
