import { WarehouseSchema } from '../schemas/warehouse.schema.js';
import { createWarehouse } from '../../../domain/entities/warehouse.js';

export const warehouseMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;
    return createWarehouse({
      id: dbModel.id,
      tenantId: dbModel.tenantId,
      name: dbModel.name,
      code: dbModel.code,
      address: dbModel.address,
      createdAt: dbModel.createdAt
    });
  },
  toPersistence: (domainEntity) => {
    return WarehouseSchema.parse({
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      name: domainEntity.name,
      code: domainEntity.code,
      address: domainEntity.address,
      createdAt: domainEntity.createdAt || new Date().toISOString()
    });
  },
  toDomainList: (dbModels) => dbModels.map(warehouseMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(warehouseMapper.toPersistence)
};
