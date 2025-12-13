import { createPurchaseOrder } from '../../../domain/entities/purchase-order.js';

export const purchaseOrderMapper = {
  toPersistence: (domainEntity) => {
    return {
      id: domainEntity.id,
      supplierId: domainEntity.supplierId,
      code: domainEntity.code,
      status: domainEntity.status,
      items: domainEntity.items,
      expectedDate: domainEntity.expectedDate,
      notes: domainEntity.notes,
      totalCost: domainEntity.totalCost,
      issuedAt: domainEntity.issuedAt,
      receivedAt: domainEntity.receivedAt,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt
    };
  },
  toDomain: (persistenceEntity) => {
    if (!persistenceEntity) return null;
    return createPurchaseOrder({
      id: persistenceEntity.id,
      supplierId: persistenceEntity.supplierId,
      code: persistenceEntity.code,
      status: persistenceEntity.status,
      items: persistenceEntity.items,
      expectedDate: persistenceEntity.expectedDate,
      notes: persistenceEntity.notes,
      totalCost: persistenceEntity.totalCost,
      issuedAt: persistenceEntity.issuedAt,
      receivedAt: persistenceEntity.receivedAt,
      createdAt: persistenceEntity.createdAt,
      updatedAt: persistenceEntity.updatedAt
    });
  },
  toDomainList: (persistenceList) => {
    return persistenceList.map(item => purchaseOrderMapper.toDomain(item)).filter(item => item !== null);
  }
};
