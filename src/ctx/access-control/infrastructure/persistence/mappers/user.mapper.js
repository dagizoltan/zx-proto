// src/ctx/access-control/infrastructure/persistence/mappers/user.mapper.js
import { UserSchema } from '../schemas/user.schema.js';
import { createUser } from '../../../domain/entities/user.js';

export const userMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;

    return createUser({
      id: dbModel.id,
      email: dbModel.email,
      passwordHash: dbModel.passwordHash,
      name: dbModel.name,
      roleIds: dbModel.roleIds,
    });
  },

  toPersistence: (domainEntity) => {
    return UserSchema.parse({
      id: domainEntity.id,
      email: domainEntity.email,
      passwordHash: domainEntity.passwordHash,
      name: domainEntity.name,
      roleIds: domainEntity.roleIds,
      createdAt: domainEntity.createdAt || new Date().toISOString()
    });
  },

  toDomainList: (dbModels) => {
    return dbModels.map(userMapper.toDomain).filter(Boolean);
  },

  toPersistenceList: (domainEntities) => {
    return domainEntities.map(userMapper.toPersistence);
  }
};
