import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { ShipmentSchema } from '../../../../ctx/orders/domain/schemas/orders.schema.js';

export const createKVShipmentRepository = (kvPool) => {
  return createRepository(kvPool, 'shipments', [
    useSchema(ShipmentSchema),
    useIndexing({
        'order': (s) => s.orderId,
        'status': (s) => s.status
    })
  ]);
};
