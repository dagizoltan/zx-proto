import { createRepository, useSchema, useIndexing, Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { TaskExecutionSchema } from '../persistence/schemas/task-execution.schema.js';
import { taskExecutionMapper } from '../persistence/mappers/task-execution.mapper.js';

export const createKVTaskExecutionRepository = (kvPool) => {
    const baseRepo = createRepository(kvPool, 'task_executions', [
        useSchema(TaskExecutionSchema),
        useIndexing({
            'taskId': (e) => e.taskId, // Renamed from task
            'status': (e) => e.status,
            'startedAt': (e) => e.startedAt // Renamed from timestamp_desc
        })
    ]);

    return {
        save: async (tenantId, domainEntity) => {
            try {
                const persistenceModel = taskExecutionMapper.toPersistence(domainEntity);
                const result = await baseRepo.save(tenantId, persistenceModel);
                if (isErr(result)) return result;
                return Ok(taskExecutionMapper.toDomain(result.value));
            } catch (e) {
                return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
            }
        },
        findById: async (tenantId, id) => {
            const result = await baseRepo.findById(tenantId, id);
            if (isErr(result)) return result;
            return Ok(taskExecutionMapper.toDomain(result.value));
        },
        findByIds: async (tenantId, ids) => {
            const result = await baseRepo.findByIds(tenantId, ids);
            if (isErr(result)) return result;
            return Ok(taskExecutionMapper.toDomainList(result.value));
        },
        delete: (tenantId, id) => baseRepo.delete(tenantId, id),
        list: async (tenantId, options) => {
            const result = await baseRepo.list(tenantId, options);
            if (isErr(result)) return result;
            return Ok({ ...result.value, items: taskExecutionMapper.toDomainList(result.value.items) });
        },
        queryByIndex: async (tenantId, indexName, value, options) => {
            // Compatibility wrapper
            const filter = {};
            filter[indexName] = value;
            const result = await baseRepo.query(tenantId, { filter, ...options });
            if (isErr(result)) return result;
            return Ok({ ...result.value, items: taskExecutionMapper.toDomainList(result.value.items) });
        },
        query: async (tenantId, options, context) => {
            const result = await baseRepo.query(tenantId, options, context);
            if (isErr(result)) return result;
            return Ok({ ...result.value, items: taskExecutionMapper.toDomainList(result.value.items) });
        }
    };
};
