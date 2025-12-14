import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { OrderSchema } from '../persistence/schemas/order.schema.js';
import { orderMapper } from '../persistence/mappers/order.mapper.js';

export const createKVOrderRepositoryAdapter = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'orders', [
    useSchema(OrderSchema),
    useIndexing({
      'customerId': (order) => order.customerId, // Renamed from 'customer'
      'status': (order) => order.status
    })
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = orderMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(orderMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'PERSISTENCE_ERROR', message: e.message });
      }
    },

    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(orderMapper.toDomain(result.value));
    },

    query: async (tenantId, options) => {
      const result = await baseRepo.query(tenantId, options);
      if (isErr(result)) return result;
      return Ok({
        ...result.value,
        items: orderMapper.toDomainList(result.value.items)
      });
    }
  };
};
