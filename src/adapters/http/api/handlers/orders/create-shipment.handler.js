import { toApiShipment } from '../../transformers/shipments.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createShipmentHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');
  const body = await c.req.json(); // Or validatedData? This handler might be manual or use validation middleware differently.
  // The route uses :id param, so likely manual body parsing or generic middleware.

  // Use wrapper
  const shipment = unwrap(await orders.useCases.createShipment.execute(tenantId, {
      orderId,
      carrier: body.carrier,
      trackingNumber: body.trackingNumber,
      code: body.code || `SH-${Date.now()}`,
      items: body.items
  }));

  return c.json(toApiShipment(shipment), 201);
};
