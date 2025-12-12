import { createRepository } from '../../../../../lib/trust/repo.js';
import { useSchema } from '../../../../../lib/trust/middleware/schema.js';
import { useIndexing } from '../../../../../lib/trust/middleware/indexing.js';
import { ShipmentSchema } from '../../../../ctx/orders/domain/schemas/orders.schema.js';

export const createKVShipmentRepository = (kv) => {
  return createRepository(
    kv,
    'shipments',
    [
      useSchema(ShipmentSchema),
      useIndexing((shipment) => {
          const indexes = [];
          if (shipment.orderId) {
              indexes.push({ key: ['shipments_by_order', shipment.orderId], value: shipment.id });
          }
          return indexes;
      })
    ]
  );
};
