import { CategorySchema } from '../schemas/category.schema.js';
import { createCategory } from '../../../domain/entities/category.js';

export const categoryMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;

    return createCategory({
      id: dbModel.id,
      name: dbModel.name,
      parentId: dbModel.parentId,
      description: dbModel.description
    });
  },

  toPersistence: (domainEntity) => {
    return CategorySchema.parse({
      id: domainEntity.id,
      name: domainEntity.name,
      parentId: domainEntity.parentId,
      description: domainEntity.description
    });
  },

  toDomainList: (dbModels) => {
    return dbModels.map(categoryMapper.toDomain).filter(Boolean);
  },

  toPersistenceList: (domainEntities) => {
    return domainEntities.map(categoryMapper.toPersistence);
  }
};
