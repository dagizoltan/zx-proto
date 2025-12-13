import { StockEntrySchema } from '../schemas/stock-entry.schema.js';
import { createStockEntry } from '../../../domain/entities/stock-entry.js';

export const stockEntryMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;
    return createStockEntry({
      id: dbModel.id,
      tenantId: dbModel.tenantId,
      productId: dbModel.productId,
      locationId: dbModel.locationId,
      quantity: dbModel.quantity,
      reservedQuantity: dbModel.reservedQuantity,
      batchId: dbModel.batchId,
    });
  },
  toPersistence: (domainEntity) => {
    return StockEntrySchema.parse({
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      productId: domainEntity.productId,
      locationId: domainEntity.locationId,
      quantity: domainEntity.quantity,
      reservedQuantity: domainEntity.reservedQuantity,
      batchId: domainEntity.batchId,
      updatedAt: domainEntity.updatedAt || new Date().toISOString()
    });
  },
  toDomainList: (dbModels) => dbModels.map(stockEntryMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(stockEntryMapper.toPersistence)
};
