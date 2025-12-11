import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { WarehouseSchema } from '../../../../ctx/inventory/domain/schemas/inventory.schema.js';

export const createKVWarehouseRepository = (kvPool) => {
  return createRepository(kvPool, 'warehouses', [
    useSchema(WarehouseSchema)
  ]);
};
