import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { StockEntrySchema } from '../../../../ctx/inventory/domain/schemas/inventory.schema.js';

export const createKVStockRepository = (kvPool) => {
  return createRepository(kvPool, 'stock', [
    useSchema(StockEntrySchema),
    useIndexing({
        'product': (s) => s.productId,
        'location': (s) => s.locationId,
        'batch': (s) => s.batchId
    })
  ]);
};
