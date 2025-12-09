export const updateOrderStatusHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const id = c.req.param('id');
  const orders = c.ctx.get('domain.orders');
  const body = await c.req.json();
  const status = body.status;

  if (!status) return c.json({ error: 'Status is required' }, 400);

  try {
    const updatedOrder = await orders.useCases.updateOrderStatus.execute(tenantId, id, status);
    return c.json(updatedOrder);
  } catch (e) {
    return c.json({ error: e.message }, 400);
  }
};
