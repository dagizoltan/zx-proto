import { ProductSchema } from '../schemas/product.schema.js';
import { createProduct } from '../../../domain/entities/product.js';

export const productMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;

    return createProduct({
      id: dbModel.id,
      sku: dbModel.sku,
      name: dbModel.name,
      description: dbModel.description,
      categoryId: dbModel.categoryId,
      price: dbModel.price,
      priceRules: dbModel.priceRules,
      type: dbModel.type,
      parentId: dbModel.parentId,
      variantAttributes: dbModel.variantAttributes,
      configurableAttributes: dbModel.configurableAttributes,
      status: dbModel.status,
      createdAt: dbModel.createdAt,
      updatedAt: dbModel.updatedAt
    });
  },

  toPersistence: (domainEntity) => {
    return ProductSchema.parse({
      id: domainEntity.id,
      sku: domainEntity.sku,
      name: domainEntity.name,
      description: domainEntity.description,
      categoryId: domainEntity.categoryId,
      price: domainEntity.price,
      priceRules: domainEntity.priceRules,
      type: domainEntity.type,
      parentId: domainEntity.parentId,
      variantAttributes: domainEntity.variantAttributes,
      configurableAttributes: domainEntity.configurableAttributes,
      status: domainEntity.status,
      createdAt: domainEntity.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  toDomainList: (dbModels) => {
    return dbModels.map(productMapper.toDomain).filter(Boolean);
  },

  toPersistenceList: (domainEntities) => {
    return domainEntities.map(productMapper.toPersistence);
  }
};
