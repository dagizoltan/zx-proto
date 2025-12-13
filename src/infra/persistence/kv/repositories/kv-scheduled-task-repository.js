import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { ScheduledTaskSchema } from '../../../../ctx/scheduler/infrastructure/persistence/schemas/scheduled-task.schema.js';
import { scheduledTaskMapper } from '../../../../ctx/scheduler/infrastructure/persistence/mappers/scheduled-task.mapper.js';

export const createKVScheduledTaskRepository = (kvPool) => {
    const baseRepo = createRepository(kvPool, 'scheduled_tasks', [
        useSchema(ScheduledTaskSchema),
        useIndexing({
            'enabled': (t) => t.enabled ? 'true' : 'false',
            'handler': (t) => t.handlerKey
        })
    ]);

    return {
        save: async (tenantId, domainEntity) => {
            try {
                const persistenceModel = scheduledTaskMapper.toPersistence(domainEntity, tenantId);
                const result = await baseRepo.save(tenantId, persistenceModel);
                if (isErr(result)) return result;
                return Ok(scheduledTaskMapper.toDomain(result.value));
            } catch (e) {
                return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
            }
        },
        findById: async (tenantId, id) => {
            const result = await baseRepo.findById(tenantId, id);
            if (isErr(result)) return result;
            return Ok(scheduledTaskMapper.toDomain(result.value));
        },
        findByIds: async (tenantId, ids) => {
            const result = await baseRepo.findByIds(tenantId, ids);
            if (isErr(result)) return result;
            return Ok(scheduledTaskMapper.toDomainList(result.value));
        },
        delete: (tenantId, id) => baseRepo.delete(tenantId, id),
        list: async (tenantId, options) => {
            const result = await baseRepo.list(tenantId, options);
            if (isErr(result)) return result;
            return Ok({ ...result.value, items: scheduledTaskMapper.toDomainList(result.value.items) });
        },
        queryByIndex: async (tenantId, indexName, value, options) => {
            const result = await baseRepo.queryByIndex(tenantId, indexName, value, options);
            if (isErr(result)) return result;
            return Ok({ ...result.value, items: scheduledTaskMapper.toDomainList(result.value.items) });
        },
        query: async (tenantId, options, context) => {
            const result = await baseRepo.query(tenantId, options, context);
            if (isErr(result)) return result;
            return Ok({ ...result.value, items: scheduledTaskMapper.toDomainList(result.value.items) });
        }
    };
};
