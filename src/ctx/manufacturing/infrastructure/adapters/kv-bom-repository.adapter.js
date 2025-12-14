import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { BOMSchema } from '../persistence/schemas/bom.schema.js';
import { bomMapper } from '../persistence/mappers/bom.mapper.js';

export const createKVBOMRepositoryAdapter = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'boms', [
    useSchema(BOMSchema),
    useIndexing({
        'productId': (b) => b.productId // Renamed from 'product'
    })
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = bomMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(bomMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
      }
    },
    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(bomMapper.toDomain(result.value));
    },
    findByIds: async (tenantId, ids) => {
      const result = await baseRepo.findByIds(tenantId, ids);
      if (isErr(result)) return result;
      return Ok(bomMapper.toDomainList(result.value));
    },
    delete: (tenantId, id) => baseRepo.delete(tenantId, id),
    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: bomMapper.toDomainList(result.value.items) });
    },
    queryByIndex: async (tenantId, indexName, value, options) => {
      // Compatibility wrapper
      const filter = {};
      filter[indexName] = value;
      const result = await baseRepo.query(tenantId, { filter, ...options });
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: bomMapper.toDomainList(result.value.items) });
    },
    query: async (tenantId, options, context) => {
      const result = await baseRepo.query(tenantId, options, context);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: bomMapper.toDomainList(result.value.items) });
    }
  };
};
