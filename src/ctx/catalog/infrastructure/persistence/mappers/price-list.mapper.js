import { PriceListSchema } from '../schemas/price-list.schema.js';
import { createPriceList } from '../../../domain/entities/price-list.js';

export const priceListMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;

    return createPriceList({
      id: dbModel.id,
      name: dbModel.name,
      currency: dbModel.currency,
      prices: dbModel.prices
    });
  },

  toPersistence: (domainEntity) => {
    return PriceListSchema.parse({
      id: domainEntity.id,
      name: domainEntity.name,
      currency: domainEntity.currency,
      prices: domainEntity.prices
    });
  },

  toDomainList: (dbModels) => {
    return dbModels.map(priceListMapper.toDomain).filter(Boolean);
  },

  toPersistenceList: (domainEntities) => {
    return domainEntities.map(priceListMapper.toPersistence);
  }
};
