export const getOrderHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const id = c.req.param('id');
  const orders = c.ctx.get('domain.orders');

  const order = await orders.useCases.getOrder.execute(tenantId, id);
  if (!order) return c.json({ error: 'Order not found' }, 404);

  return c.json(order);
};
