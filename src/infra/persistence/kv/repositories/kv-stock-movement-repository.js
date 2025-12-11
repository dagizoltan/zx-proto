import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { StockMovementSchema } from '../../../../ctx/inventory/domain/schemas/inventory.schema.js';

export const createKVStockMovementRepository = (kvPool) => {
  return createRepository(kvPool, 'stock_movements', [
    useSchema(StockMovementSchema),
    useIndexing({
        'product': (m) => m.productId,
        'reference': (m) => m.referenceId, // For finding movements by Order/PO
        'type': (m) => m.type
    })
  ]);
};
