import { LocationSchema } from '../schemas/location.schema.js';
import { createLocation } from '../../../domain/entities/warehouse.js';

export const locationMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;
    return createLocation({
      id: dbModel.id,
      tenantId: dbModel.tenantId,
      warehouseId: dbModel.warehouseId,
      parentId: dbModel.parentId,
      code: dbModel.code,
      type: dbModel.type,
      capacity: dbModel.capacity,
      createdAt: dbModel.createdAt
    });
  },
  toPersistence: (domainEntity) => {
    return LocationSchema.parse({
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      warehouseId: domainEntity.warehouseId,
      parentId: domainEntity.parentId,
      code: domainEntity.code,
      type: domainEntity.type,
      capacity: domainEntity.capacity,
      createdAt: domainEntity.createdAt || new Date().toISOString()
    });
  },
  toDomainList: (dbModels) => dbModels.map(locationMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(locationMapper.toPersistence)
};
