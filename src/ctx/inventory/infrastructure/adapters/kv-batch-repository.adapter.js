import { createRepository, useSchema, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { BatchSchema } from '../../../../ctx/inventory/infrastructure/persistence/schemas/batch.schema.js';
import { batchMapper } from '../../../../ctx/inventory/infrastructure/persistence/mappers/batch.mapper.js';

export const createKVBatchRepository = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'batches', [
      useSchema(BatchSchema)
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = batchMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(batchMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
      }
    },
    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(batchMapper.toDomain(result.value));
    },
    findByIds: async (tenantId, ids) => {
      const result = await baseRepo.findByIds(tenantId, ids);
      if (isErr(result)) return result;
      return Ok(batchMapper.toDomainList(result.value));
    },
    delete: (tenantId, id) => baseRepo.delete(tenantId, id),
    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: batchMapper.toDomainList(result.value.items) });
    },
    queryByIndex: async (tenantId, indexName, value, options) => {
      const result = await baseRepo.queryByIndex(tenantId, indexName, value, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: batchMapper.toDomainList(result.value.items) });
    },
    query: async (tenantId, options, context) => {
      const result = await baseRepo.query(tenantId, options, context);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: batchMapper.toDomainList(result.value.items) });
    }
  };
};
