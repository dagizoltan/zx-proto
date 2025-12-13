import { createWorkOrder } from '../../../domain/entities/work-order.js';

export const workOrderMapper = {
  toPersistence: (domainEntity) => {
    return {
      id: domainEntity.id,
      bomId: domainEntity.bomId,
      quantity: domainEntity.quantity,
      status: domainEntity.status,
      startDate: domainEntity.startDate,
      completionDate: domainEntity.completionDate,
      assignedTo: domainEntity.assignedTo,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt
    };
  },
  toDomain: (persistenceEntity) => {
    if (!persistenceEntity) return null;
    return createWorkOrder({
      id: persistenceEntity.id,
      bomId: persistenceEntity.bomId,
      quantity: persistenceEntity.quantity,
      status: persistenceEntity.status,
      startDate: persistenceEntity.startDate,
      completionDate: persistenceEntity.completionDate,
      assignedTo: persistenceEntity.assignedTo,
      createdAt: persistenceEntity.createdAt,
      updatedAt: persistenceEntity.updatedAt
    });
  },
  toDomainList: (persistenceList) => {
    return persistenceList.map(item => workOrderMapper.toDomain(item)).filter(item => item !== null);
  }
};
