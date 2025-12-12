import { createRepository } from '../../../../../lib/trust/repo.js';
import { useSchema } from '../../../../../lib/trust/middleware/schema.js';
import { useIndexing } from '../../../../../lib/trust/middleware/indexing.js';
import { OrderSchema } from '../../../../ctx/orders/domain/schemas/orders.schema.js';

export const createKVOrderRepository = (kv) => {
  return createRepository(
    kv,
    'orders',
    [
      useSchema(OrderSchema),
      useIndexing((order) => {
        const indexes = [];
        if (order.customerId) {
          indexes.push({ key: ['orders_by_customer', order.customerId], value: order.id });
        }
        if (order.status) {
          indexes.push({ key: ['orders_by_status', order.status], value: order.id });
        }
        return indexes;
      })
    ]
  );
};
