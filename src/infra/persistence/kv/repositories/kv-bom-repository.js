import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { BOMSchema } from '../../../../ctx/manufacturing/domain/schemas/manufacturing.schema.js';

export const createKVBOMRepository = (kvPool) => {
  return createRepository(kvPool, 'boms', [
    useSchema(BOMSchema),
    useIndexing({
        'product': (b) => b.productId
    })
  ]);
};
