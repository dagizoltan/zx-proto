import { createRepository, useSchema } from '../../../../../lib/trust/index.js';
import { BatchSchema } from '../../../../ctx/inventory/domain/schemas/inventory.schema.js';

export const createKVBatchRepository = (kvPool) => {
  return createRepository(kvPool, 'batches', [
      useSchema(BatchSchema)
  ]);
};
