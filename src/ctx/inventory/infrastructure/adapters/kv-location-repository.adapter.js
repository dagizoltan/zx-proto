import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { LocationSchema } from '../../../../ctx/inventory/infrastructure/persistence/schemas/location.schema.js';
import { locationMapper } from '../../../../ctx/inventory/infrastructure/persistence/mappers/location.mapper.js';

export const createKVLocationRepository = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'locations', [
    useSchema(LocationSchema),
    useIndexing({
        'warehouse': (l) => l.warehouseId,
        'code': (l) => l.code
    })
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = locationMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(locationMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
      }
    },
    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(locationMapper.toDomain(result.value));
    },
    findByIds: async (tenantId, ids) => {
      const result = await baseRepo.findByIds(tenantId, ids);
      if (isErr(result)) return result;
      return Ok(locationMapper.toDomainList(result.value));
    },
    delete: (tenantId, id) => baseRepo.delete(tenantId, id),
    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: locationMapper.toDomainList(result.value.items) });
    },
    queryByIndex: async (tenantId, indexName, value, options) => {
      const result = await baseRepo.queryByIndex(tenantId, indexName, value, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: locationMapper.toDomainList(result.value.items) });
    },
    query: async (tenantId, options, context) => {
      const result = await baseRepo.query(tenantId, options, context);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: locationMapper.toDomainList(result.value.items) });
    }
  };
};
