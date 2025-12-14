import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { SupplierSchema } from '../persistence/schemas/supplier.schema.js';
import { supplierMapper } from '../persistence/mappers/supplier.mapper.js';

export const createKVSupplierRepositoryAdapter = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'suppliers', [
    useSchema(SupplierSchema),
    useIndexing({
        'code': (s) => s.code,
        'contactEmail': (s) => s.contactEmail // Renamed from 'email'
    })
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = supplierMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(supplierMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
      }
    },
    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(supplierMapper.toDomain(result.value));
    },
    findByIds: async (tenantId, ids) => {
      const result = await baseRepo.findByIds(tenantId, ids);
      if (isErr(result)) return result;
      return Ok(supplierMapper.toDomainList(result.value));
    },
    delete: (tenantId, id) => baseRepo.delete(tenantId, id),
    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: supplierMapper.toDomainList(result.value.items) });
    },
    queryByIndex: async (tenantId, indexName, value, options) => {
      // Compatibility wrapper
      const filter = {};
      filter[indexName] = value;
      const result = await baseRepo.query(tenantId, { filter, ...options });
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: supplierMapper.toDomainList(result.value.items) });
    },
    query: async (tenantId, options, context) => {
        const result = await baseRepo.query(tenantId, options, context);
        if (isErr(result)) return result;
        return Ok({ ...result.value, items: supplierMapper.toDomainList(result.value.items) });
    }
  };
};
