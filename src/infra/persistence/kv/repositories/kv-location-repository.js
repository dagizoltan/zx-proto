import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { LocationSchema } from '../../../../ctx/inventory/domain/schemas/inventory.schema.js';

export const createKVLocationRepository = (kvPool) => {
  return createRepository(kvPool, 'locations', [
    useSchema(LocationSchema),
    useIndexing({
        'warehouse': (l) => l.warehouseId,
        'code': (l) => l.code
    })
  ]);
};
