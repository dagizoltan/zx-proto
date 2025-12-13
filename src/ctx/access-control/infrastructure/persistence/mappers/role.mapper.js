// src/ctx/access-control/infrastructure/persistence/mappers/role.mapper.js
import { RoleSchema } from '../schemas/role.schema.js';
import { createRole } from '../../../domain/entities/role.js';

export const roleMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;

    return createRole({
      id: dbModel.id,
      name: dbModel.name,
      permissions: dbModel.permissions,
    });
  },

  toPersistence: (domainEntity) => {
    return RoleSchema.parse({
      id: domainEntity.id,
      name: domainEntity.name,
      permissions: domainEntity.permissions
    });
  },

  toDomainList: (dbModels) => {
    return dbModels.map(roleMapper.toDomain).filter(Boolean);
  },

  toPersistenceList: (domainEntities) => {
    return domainEntities.map(roleMapper.toPersistence);
  }
};
