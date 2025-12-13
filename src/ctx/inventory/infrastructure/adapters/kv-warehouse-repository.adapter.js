import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { WarehouseSchema } from '../../../../ctx/inventory/infrastructure/persistence/schemas/warehouse.schema.js';
import { warehouseMapper } from '../../../../ctx/inventory/infrastructure/persistence/mappers/warehouse.mapper.js';

export const createKVWarehouseRepository = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'warehouses', [
    useSchema(WarehouseSchema)
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = warehouseMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(warehouseMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
      }
    },
    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(warehouseMapper.toDomain(result.value));
    },
    findByIds: async (tenantId, ids) => {
      const result = await baseRepo.findByIds(tenantId, ids);
      if (isErr(result)) return result;
      return Ok(warehouseMapper.toDomainList(result.value));
    },
    delete: (tenantId, id) => baseRepo.delete(tenantId, id),
    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: warehouseMapper.toDomainList(result.value.items) });
    },
    queryByIndex: async (tenantId, indexName, value, options) => {
      const result = await baseRepo.queryByIndex(tenantId, indexName, value, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: warehouseMapper.toDomainList(result.value.items) });
    },
    query: async (tenantId, options, context) => {
      const result = await baseRepo.query(tenantId, options, context);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: warehouseMapper.toDomainList(result.value.items) });
    }
  };
};
