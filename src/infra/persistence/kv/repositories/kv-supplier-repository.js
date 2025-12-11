import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { SupplierSchema } from '../../../../ctx/procurement/domain/schemas/procurement.schema.js';

export const createKVSupplierRepository = (kvPool) => {
  return createRepository(kvPool, 'suppliers', [
    useSchema(SupplierSchema),
    useIndexing({
        'status': (s) => s.status
    })
  ]);
};
