import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth-middleware.js';

export const orderRoutes = new Hono();

orderRoutes.get('/', authMiddleware, async (c) => {
    const tenantId = c.get('tenantId');
    const { limit, cursor, status, q: search, minTotal, maxTotal } = c.req.query();

    const orders = c.ctx.get('domain.orders');

    const result = await orders.useCases.listOrders.execute(tenantId, {
        limit: limit ? parseInt(limit) : 10,
        cursor,
        status,
        search,
        minTotal: minTotal ? parseFloat(minTotal) : undefined,
        maxTotal: maxTotal ? parseFloat(maxTotal) : undefined,
    });

    return c.json(result);
});

orderRoutes.post('/', authMiddleware, async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const data = await c.req.json();
    const { items } = data;

    const orders = c.ctx.get('domain.orders');

    // Validation is handled in the use case
    const order = await orders.useCases.createOrder.execute(tenantId, user.id, items);
    return c.json(order, 201);
});
