import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { OrderSchema } from '../../../../ctx/orders/domain/schemas/orders.schema.js';

export const createKVOrderRepository = (kvPool) => {
  return createRepository(kvPool, 'orders', [
    useSchema(OrderSchema),
    useIndexing({
        'status': (o) => o.status,
        'customer': (o) => o.customerId
    })
  ]);
};
