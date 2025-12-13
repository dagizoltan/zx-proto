import { StockMovementSchema } from '../schemas/stock-movement.schema.js';
import { createStockMovement } from '../../../domain/entities/stock-movement.js';

export const stockMovementMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;
    return createStockMovement({
      id: dbModel.id,
      tenantId: dbModel.tenantId,
      productId: dbModel.productId,
      quantity: dbModel.quantity,
      type: dbModel.type,
      fromLocationId: dbModel.fromLocationId,
      toLocationId: dbModel.toLocationId,
      referenceId: dbModel.referenceId,
      batchId: dbModel.batchId,
      reason: dbModel.reason,
      userId: dbModel.userId,
      // timestamp is auto-set in entity factory, or we map it if we want persistence time
    });
  },
  toPersistence: (domainEntity) => {
    return StockMovementSchema.parse({
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      productId: domainEntity.productId,
      quantity: domainEntity.quantity,
      type: domainEntity.type,
      fromLocationId: domainEntity.fromLocationId,
      toLocationId: domainEntity.toLocationId,
      referenceId: domainEntity.referenceId,
      batchId: domainEntity.batchId,
      reason: domainEntity.reason,
      userId: domainEntity.userId,
      timestamp: domainEntity.timestamp || new Date().toISOString()
    });
  },
  toDomainList: (dbModels) => dbModels.map(stockMovementMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(stockMovementMapper.toPersistence)
};
