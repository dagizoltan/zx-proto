import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { StockEntrySchema } from '../../../../ctx/inventory/infrastructure/persistence/schemas/stock-entry.schema.js';
import { stockEntryMapper } from '../../../../ctx/inventory/infrastructure/persistence/mappers/stock-entry.mapper.js';

export const createKVStockRepository = (kvPool) => {
    const baseRepo = createRepository(kvPool, 'stock', [
        useSchema(StockEntrySchema),
        useIndexing({
            'product': (s) => s.productId,
            'location': (s) => s.locationId,
            'batch': (s) => s.batchId
        })
    ]);

    const findEntry = async (tenantId, productId, locationId, batchId) => {
        const res = await baseRepo.queryByIndex(tenantId, 'product', productId, { limit: 1000 });
        if (isErr(res)) return res;

        const entry = res.value.items.find(s =>
            s.locationId === locationId && s.batchId === batchId
        );

        return Ok(entry ? stockEntryMapper.toDomain(entry) : null);
    };

    return {
        save: async (tenantId, domainEntity) => {
          try {
            const persistenceModel = stockEntryMapper.toPersistence(domainEntity);
            const result = await baseRepo.save(tenantId, persistenceModel);
            if (isErr(result)) return result;
            return Ok(stockEntryMapper.toDomain(result.value));
          } catch (e) {
            return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
          }
        },
        findById: async (tenantId, id) => {
          const result = await baseRepo.findById(tenantId, id);
          if (isErr(result)) return result;
          return Ok(stockEntryMapper.toDomain(result.value));
        },
        findByIds: async (tenantId, ids) => {
          const result = await baseRepo.findByIds(tenantId, ids);
          if (isErr(result)) return result;
          return Ok(stockEntryMapper.toDomainList(result.value));
        },
        delete: (tenantId, id) => baseRepo.delete(tenantId, id),
        list: async (tenantId, options) => {
          const result = await baseRepo.list(tenantId, options);
          if (isErr(result)) return result;
          return Ok({ ...result.value, items: stockEntryMapper.toDomainList(result.value.items) });
        },
        queryByIndex: async (tenantId, indexName, value, options) => {
          const result = await baseRepo.queryByIndex(tenantId, indexName, value, options);
          if (isErr(result)) return result;
          return Ok({ ...result.value, items: stockEntryMapper.toDomainList(result.value.items) });
        },
        query: async (tenantId, options, context) => {
          const result = await baseRepo.query(tenantId, options, context);
          if (isErr(result)) return result;
          return Ok({ ...result.value, items: stockEntryMapper.toDomainList(result.value.items) });
        },
        findEntry
    };
};
