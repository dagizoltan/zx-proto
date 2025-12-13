import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { ProductSchema } from '../../../../ctx/catalog/infrastructure/persistence/schemas/product.schema.js';
import { productMapper } from '../../../../ctx/catalog/infrastructure/persistence/mappers/product.mapper.js';

/**
 * KV Adapter for Product Repository
 * Implements: IProductRepository
 */
export const createKVProductRepositoryAdapter = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'products', [
    useSchema(ProductSchema),
    useIndexing({
        'sku': (p) => p.sku,
        'status': (p) => p.status,
        'category': (p) => p.categoryId,
        'parent': (p) => p.parentId
    })
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = productMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(productMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'PERSISTENCE_ERROR', message: e.message, issues: e.issues });
      }
    },

    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(productMapper.toDomain(result.value));
    },

    findBySku: async (tenantId, sku) => {
        const result = await baseRepo.queryByIndex(tenantId, 'sku', sku);
        if (isErr(result)) return result;
        const items = result.value.items;
        if (items.length === 0) return Ok(null);
        return Ok(productMapper.toDomain(items[0]));
    },

    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: productMapper.toDomainList(result.value.items) });
    },

    search: async (tenantId, term) => {
        const result = await baseRepo.list(tenantId, { limit: 100 });
        if (isErr(result)) return result;

        const termLower = term.toLowerCase();
        const filtered = result.value.items.filter(p =>
            (p.name && p.name.toLowerCase().includes(termLower)) ||
            (p.sku && p.sku.toLowerCase().includes(termLower))
        );

        return Ok(productMapper.toDomainList(filtered));
    },

    findByCategory: async (tenantId, categoryId) => {
        const result = await baseRepo.queryByIndex(tenantId, 'category', categoryId);
        if (isErr(result)) return result;
        return Ok(productMapper.toDomainList(result.value.items));
    },

    findByIds: async (tenantId, ids) => {
        const result = await baseRepo.findByIds(tenantId, ids);
        if (isErr(result)) return result;
        return Ok(productMapper.toDomainList(result.value));
    },

    // Support query for advanced filtering (inventory uses it)
    query: async (tenantId, options) => {
         // Map options.filter to KV query if possible, or filter in memory
         const result = await baseRepo.list(tenantId, options);
         if (isErr(result)) return result;
         // Basic implementation: return all (filtering happens in use case or memory if repo doesn't support complex query)
         // Trust repo might support 'filter' in query?
         return Ok({ ...result.value, items: productMapper.toDomainList(result.value.items) });
    }
  };
};
