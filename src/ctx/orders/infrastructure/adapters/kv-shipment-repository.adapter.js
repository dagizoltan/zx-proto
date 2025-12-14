import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { ShipmentSchema } from '../persistence/schemas/shipment.schema.js';
import { shipmentMapper } from '../persistence/mappers/shipment.mapper.js';

export const createKVShipmentRepositoryAdapter = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'shipments', [
    useSchema(ShipmentSchema),
    useIndexing({
      'orderId': (s) => s.orderId // Renamed from 'order'
    })
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = shipmentMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(shipmentMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'PERSISTENCE_ERROR', message: e.message });
      }
    },

    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(shipmentMapper.toDomain(result.value));
    },

    queryByIndex: async (tenantId, indexName, value, options) => {
      // Compatibility wrapper
      const filter = {};
      filter[indexName] = value;
      const result = await baseRepo.query(tenantId, { filter, ...options });
      if (isErr(result)) return result;
      return Ok({
        ...result.value,
        items: shipmentMapper.toDomainList(result.value.items)
      });
    },

    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({
        ...result.value,
        items: shipmentMapper.toDomainList(result.value.items)
      });
    },

    // Add generic query support
    query: async (tenantId, options) => {
      const result = await baseRepo.query(tenantId, options);
      if (isErr(result)) return result;
      return Ok({
        ...result.value,
        items: shipmentMapper.toDomainList(result.value.items)
      });
    }
  };
};
