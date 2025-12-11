import { createRepository, useSchema } from '../../../../../lib/trust/index.js';
import { PriceListSchema } from '../../../../ctx/catalog/domain/schemas/catalog.schema.js';

export const createKVPriceListRepository = (kvPool) => {
  return createRepository(kvPool, 'pricelists', [
    useSchema(PriceListSchema)
  ]);
};
