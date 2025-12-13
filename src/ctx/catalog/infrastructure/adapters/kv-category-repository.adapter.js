import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { CategorySchema } from '../../../../ctx/catalog/infrastructure/persistence/schemas/category.schema.js';
import { categoryMapper } from '../../../../ctx/catalog/infrastructure/persistence/mappers/category.mapper.js';

/**
 * KV Adapter for Category Repository
 * Implements: ICategoryRepository
 */
export const createKVCategoryRepositoryAdapter = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'categories', [
    useSchema(CategorySchema),
    useIndexing({
        'parent': (c) => c.parentId
    })
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = categoryMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(categoryMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'PERSISTENCE_ERROR', message: e.message });
      }
    },

    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(categoryMapper.toDomain(result.value));
    },

    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: categoryMapper.toDomainList(result.value.items) });
    }
  };
};
