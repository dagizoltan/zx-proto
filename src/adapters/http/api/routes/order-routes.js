import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth-middleware.js';

export const orderRoutes = new Hono();

orderRoutes.post('/', authMiddleware, async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const data = await c.req.json();
    const { items } = data;

    const orders = c.ctx.get('domain.orders');

    try {
        const order = await orders.useCases.createOrder.execute(tenantId, user.id, items);
        return c.json(order, 201);
    } catch (error) {
        return c.json({ error: error.message }, 400);
    }
});
