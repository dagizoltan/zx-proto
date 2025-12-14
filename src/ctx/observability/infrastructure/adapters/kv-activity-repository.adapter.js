import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { ActivitySchema } from '../persistence/schemas/activity.schema.js';
import { activityMapper } from '../persistence/mappers/activity.mapper.js';

export const createKVActivityRepository = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'activity_logs', [
    useSchema(ActivitySchema),
    useIndexing({
        'timestamp': (l) => l.timestamp, // Renamed from timestamp_desc
        'userId': (a) => a.userId // Renamed from user
    })
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = activityMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(activityMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
      }
    },
    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(activityMapper.toDomain(result.value));
    },
    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: activityMapper.toDomainList(result.value.items) });
    },
    query: async (tenantId, options, context) => {
      const result = await baseRepo.query(tenantId, options, context);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: activityMapper.toDomainList(result.value.items) });
    }
  };
};
