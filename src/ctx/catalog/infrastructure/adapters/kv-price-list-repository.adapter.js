import { createRepository, useSchema, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { PriceListSchema } from '../../../../ctx/catalog/infrastructure/persistence/schemas/price-list.schema.js';
import { priceListMapper } from '../../../../ctx/catalog/infrastructure/persistence/mappers/price-list.mapper.js';

/**
 * KV Adapter for PriceList Repository
 * Implements: IPriceListRepository
 */
export const createKVPriceListRepositoryAdapter = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'pricelists', [
    useSchema(PriceListSchema)
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = priceListMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(priceListMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'PERSISTENCE_ERROR', message: e.message });
      }
    },

    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(priceListMapper.toDomain(result.value));
    },

    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: priceListMapper.toDomainList(result.value.items) });
    },

    findByCurrency: async (tenantId, currency) => {
        const result = await baseRepo.list(tenantId, { limit: 100 });
        if (isErr(result)) return result;
        const filtered = result.value.items.filter(pl => pl.currency === currency);
        return Ok(priceListMapper.toDomainList(filtered));
    }
  };
};
