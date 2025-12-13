import { WorkOrderSchema } from '../schemas/work-order.schema.js';
import { createWorkOrder } from '../../../domain/entities/work-order.js';
export const workOrderMapper = {
  toDomain: (dbModel) => { if (!dbModel) return null; return createWorkOrder(dbModel); },
  toPersistence: (domainEntity) => WorkOrderSchema.parse({
        id: domainEntity.id,
        bomId: domainEntity.bomId,
        quantity: domainEntity.quantity,
        status: domainEntity.status,
        startDate: domainEntity.startDate,
        completionDate: domainEntity.completionDate,
        assignedTo: domainEntity.assignedTo
  }),
  toDomainList: (dbModels) => dbModels.map(workOrderMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(workOrderMapper.toPersistence)
};
