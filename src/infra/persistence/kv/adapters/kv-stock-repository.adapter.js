import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { StockEntrySchema } from '../../../../ctx/inventory/infrastructure/persistence/schemas/stock-entry.schema.js';
import { stockEntryMapper } from '../../../../ctx/inventory/infrastructure/persistence/mappers/stock-entry.mapper.js';

/**
 * KV Adapter for Stock Repository
 * Implements: IStockRepository
 */
export const createKVStockRepositoryAdapter = (kvPool) => {
    const baseRepo = createRepository(kvPool, 'stock', [
        useSchema(StockEntrySchema),
        useIndexing({
            'product': (s) => s.productId,
            'location': (s) => s.locationId,
            'batch': (s) => s.batchId
        })
    ]);

    return {
        save: async (tenantId, domainEntity) => {
          try {
            const persistenceModel = stockEntryMapper.toPersistence(domainEntity);
            const result = await baseRepo.save(tenantId, persistenceModel);
            if (isErr(result)) return result;
            return Ok(stockEntryMapper.toDomain(result.value));
          } catch (e) {
            return Err({ code: 'PERSISTENCE_ERROR', message: e.message });
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

        findByProduct: async (tenantId, productId) => {
            const result = await baseRepo.queryByIndex(tenantId, 'product', productId);
            if (isErr(result)) return result;
            return Ok(stockEntryMapper.toDomainList(result.value.items));
        },

        findByLocation: async (tenantId, locationId) => {
            const result = await baseRepo.queryByIndex(tenantId, 'location', locationId);
            if (isErr(result)) return result;
            return Ok(stockEntryMapper.toDomainList(result.value.items));
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
        }
    };
};
