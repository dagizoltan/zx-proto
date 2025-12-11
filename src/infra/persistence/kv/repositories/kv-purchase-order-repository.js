import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { PurchaseOrderSchema } from '../../../../ctx/procurement/domain/schemas/procurement.schema.js';

export const createKVPurchaseOrderRepository = (kvPool) => {
  return createRepository(kvPool, 'purchase_orders', [
    useSchema(PurchaseOrderSchema),
    useIndexing({
        'supplier': (po) => po.supplierId,
        'status': (po) => po.status
    })
  ]);
};
