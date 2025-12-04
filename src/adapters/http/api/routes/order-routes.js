import { Hono } from 'hono';

export const orderRoutes = new Hono();

orderRoutes.post('/', async (c) => {
    // Need auth usually
    const data = await c.req.json();
    const { userId, items } = data; // Mock userId if not in token

    const orders = c.ctx.get('domain.orders');

    try {
        const order = await orders.useCases.createOrder.execute(userId, items);
        return c.json(order, 201);
    } catch (error) {
        return c.json({ error: error.message }, 400);
    }
});
