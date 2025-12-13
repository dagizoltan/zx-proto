import { TaskExecutionSchema } from '../schemas/task-execution.schema.js';
import { createTaskExecution } from '../../../domain/entities/task-execution.js';
export const taskExecutionMapper = {
  toDomain: (dbModel) => {
    if (!dbModel) return null;
    return createTaskExecution({
        ...dbModel,
        startTime: dbModel.startedAt,
        endTime: dbModel.completedAt
    });
  },
  toPersistence: (domainEntity, tenantId) => {
    const json = domainEntity.toJSON();
    return TaskExecutionSchema.parse({
        id: json.id,
        tenantId: json.tenantId || tenantId,
        taskId: json.taskId,
        handlerKey: json.handlerKey,
        status: json.status,
        startedAt: json.startTime,
        completedAt: json.endTime,
        durationMs: undefined,
        error: typeof json.error === 'string' ? json.error : JSON.stringify(json.error)
    });
  },
  toDomainList: (dbModels) => dbModels.map(taskExecutionMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(e => taskExecutionMapper.toPersistence(e))
};
