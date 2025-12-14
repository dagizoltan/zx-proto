import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { NotificationSchema } from '../persistence/schemas/notification.schema.js';
import { notificationMapper } from '../persistence/mappers/notification.mapper.js';

export const createKVNotificationRepository = (kvPool) => {
  const baseRepo = createRepository(kvPool, 'notifications', [
    useSchema(NotificationSchema),
    useIndexing({
        'userId': (n) => n.userId, // Renamed from 'user'
        'createdAt': (n) => n.createdAt // Renamed from 'date'
        // 'user_read': removed as complex keys are less useful with memory scanning fallback,
        // can use filter: { userId: '...', read: false }
    })
  ]);

  return {
    save: async (tenantId, domainEntity) => {
      try {
        const persistenceModel = notificationMapper.toPersistence(domainEntity);
        const result = await baseRepo.save(tenantId, persistenceModel);
        if (isErr(result)) return result;
        return Ok(notificationMapper.toDomain(result.value));
      } catch (e) {
        return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
      }
    },
    findById: async (tenantId, id) => {
      const result = await baseRepo.findById(tenantId, id);
      if (isErr(result)) return result;
      return Ok(notificationMapper.toDomain(result.value));
    },
    findByIds: async (tenantId, ids) => {
      const result = await baseRepo.findByIds(tenantId, ids);
      if (isErr(result)) return result;
      return Ok(notificationMapper.toDomainList(result.value));
    },
    delete: (tenantId, id) => baseRepo.delete(tenantId, id),
    list: async (tenantId, options) => {
      const result = await baseRepo.list(tenantId, options);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: notificationMapper.toDomainList(result.value.items) });
    },
    queryByIndex: async (tenantId, indexName, value, options) => {
      // Compatibility wrapper
      const filter = {};
      filter[indexName] = value;
      const result = await baseRepo.query(tenantId, { filter, ...options });
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: notificationMapper.toDomainList(result.value.items) });
    },
    query: async (tenantId, options, context) => {
      const result = await baseRepo.query(tenantId, options, context);
      if (isErr(result)) return result;
      return Ok({ ...result.value, items: notificationMapper.toDomainList(result.value.items) });
    }
  };
};
