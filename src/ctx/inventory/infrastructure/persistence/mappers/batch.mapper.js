import { BatchSchema } from '../schemas/batch.schema.js';
import { createBatch } from '../../../domain/entities/warehouse.js';

export const batchMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;
    return createBatch({
      id: dbModel.id,
      tenantId: dbModel.tenantId,
      sku: dbModel.sku,
      batchNumber: dbModel.batchNumber,
      expiryDate: dbModel.expiryDate,
      manufacturingDate: dbModel.manufacturingDate,
      cost: dbModel.cost,
      supplierId: dbModel.supplierId,
      receivedAt: dbModel.receivedAt
    });
  },
  toPersistence: (domainEntity) => {
    return BatchSchema.parse({
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      sku: domainEntity.sku,
      batchNumber: domainEntity.batchNumber,
      expiryDate: domainEntity.expiryDate,
      manufacturingDate: domainEntity.manufacturingDate,
      cost: domainEntity.cost,
      supplierId: domainEntity.supplierId,
      receivedAt: domainEntity.receivedAt || new Date().toISOString()
    });
  },
  toDomainList: (dbModels) => dbModels.map(batchMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(batchMapper.toPersistence)
};
