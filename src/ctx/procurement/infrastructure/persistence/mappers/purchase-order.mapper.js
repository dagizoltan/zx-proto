import { PurchaseOrderSchema } from '../schemas/purchase-order.schema.js';
import { createPurchaseOrder } from '../../../domain/entities/purchase-order.js';
export const purchaseOrderMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;
    return createPurchaseOrder({
        ...dbModel,
        code: dbModel.code || 'UNKNOWN'
    });
  },
  toPersistence: (domainEntity) => PurchaseOrderSchema.parse({
        id: domainEntity.id,
        supplierId: domainEntity.supplierId,
        status: domainEntity.status,
        items: domainEntity.items,
        totalCost: domainEntity.totalCost,
        issuedAt: domainEntity.issuedAt,
        receivedAt: domainEntity.receivedAt,
        createdAt: domainEntity.createdAt
  }),
  toDomainList: (dbModels) => dbModels.map(purchaseOrderMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(purchaseOrderMapper.toPersistence)
};
