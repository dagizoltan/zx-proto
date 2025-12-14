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
        'categoryId': (p) => p.categoryId, // Renamed from 'category'
        'parentId': (p) => p.parentId      // Renamed from 'parent'
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
        // Use query engine
        const result = await baseRepo.query(tenantId, {
            filter: { sku },
            limit: 1
        });
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
        // Use query engine with 'search' filter if implemented, or loop scan
        // lib/trust supports 'search' filter via memory scanning
        const result = await baseRepo.query(tenantId, {
            filter: { search: term },
            limit: 100,
            searchFields: ['name', 'sku']
        });
        if (isErr(result)) return result;
        return Ok(productMapper.toDomainList(result.value.items));
    },

    findByCategory: async (tenantId, categoryId) => {
        const result = await baseRepo.query(tenantId, {
            filter: { categoryId }
        });
        if (isErr(result)) return result;
        return Ok(productMapper.toDomainList(result.value.items));
    },

    findByIds: async (tenantId, ids) => {
        const result = await baseRepo.findByIds(tenantId, ids);
        if (isErr(result)) return result;
        return Ok(productMapper.toDomainList(result.value));
    },

    query: async (tenantId, options) => {
         const result = await baseRepo.query(tenantId, options);
         if (isErr(result)) return result;
         return Ok({ ...result.value, items: productMapper.toDomainList(result.value.items) });
    }
  };
};
