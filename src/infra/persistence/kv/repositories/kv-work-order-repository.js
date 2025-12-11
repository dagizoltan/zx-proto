import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { WorkOrderSchema } from '../../../../ctx/manufacturing/domain/schemas/manufacturing.schema.js';

export const createKVWorkOrderRepository = (kvPool) => {
  return createRepository(kvPool, 'work_orders', [
    useSchema(WorkOrderSchema),
    useIndexing({
        'status': (w) => w.status,
        'bom': (w) => w.bomId
    })
  ]);
};
