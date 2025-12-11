import { toApiShipment } from '../../transformers/shipments.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createShipmentHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const orders = c.ctx.get('domain.orders');
  const data = c.get('validatedData'); // From validateRequest(createShipmentSchema)

  const shipment = unwrap(await orders.useCases.createShipment.execute(tenantId, {
      orderId: data.orderId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      code: data.code || `SH-${Date.now()}`,
      items: data.items
  }));

  return c.json(toApiShipment(shipment), 201);
};
