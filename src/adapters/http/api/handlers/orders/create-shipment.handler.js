export const createShipmentHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');
  const body = await c.req.json();

  // Validate body? Assuming Zod middleware handles schema, but here we manually map.
  // Body should contain: carrier, trackingNumber, items

  try {
    const shipment = await orders.useCases.createShipment.execute(tenantId, {
      orderId,
      carrier: body.carrier,
      trackingNumber: body.trackingNumber,
      code: body.code || `SH-${Date.now()}`,
      items: body.items // [{ productId, quantity }]
    });
    return c.json(shipment, 201);
  } catch (e) {
    return c.json({ error: e.message }, 400);
  }
};
