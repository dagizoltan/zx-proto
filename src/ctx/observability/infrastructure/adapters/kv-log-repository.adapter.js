import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { LogSchema } from '../persistence/schemas/log.schema.js';
import { logMapper } from '../persistence/mappers/log.mapper.js';

export const createKVLogRepository = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'logs', [
    useSchema(LogSchema),
    useIndexing({
        'level': (l) => l.level.toLowerCase(),
        'timestamp_desc': (l) => l.timestamp
    })
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = logMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(logMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
      }
    },
    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(logMapper.toDomain(result.value));
    },
    list: async (tenantId, { limit, cursor, level } = {}) => {
      // FIX: Map 'level' option to filter to use indexing and correct filtering logic
      let result;
      if (level) {
          result = await baseRepo.query(tenantId, { limit, cursor, filter: { level: level.toLowerCase() } });
      } else {
          result = await baseRepo.list(tenantId, { limit, cursor });
      }

      if (isErr(result)) return result;
      return Ok({ ...result.value, items: logMapper.toDomainList(result.value.items) });
    },
    query: async (tenantId, options, context) => {
      const result = await baseRepo.query(tenantId, options, context);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: logMapper.toDomainList(result.value.items) });
    }
  };
};
