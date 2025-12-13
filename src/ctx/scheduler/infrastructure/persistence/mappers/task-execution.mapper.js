import { createTaskExecution } from '../../../domain/entities/task-execution.js';

export const taskExecutionMapper = {
  toPersistence: (domainEntity) => {
    const json = domainEntity.toJSON ? domainEntity.toJSON() : domainEntity;
    return {
      id: json.id,
      tenantId: json.tenantId || 'default',
      taskId: json.taskId,
      handlerKey: json.handlerKey,
      startedAt: json.startTime,
      completedAt: json.endTime,
      status: json.status,
      result: json.logs, // mapping logs to result
      error: json.error,
      durationMs: json.endTime && json.startTime ? new Date(json.endTime).getTime() - new Date(json.startTime).getTime() : null
    };
  },
  toDomain: (persistenceEntity) => {
    return createTaskExecution({
      id: persistenceEntity.id,
      tenantId: persistenceEntity.tenantId,
      taskId: persistenceEntity.taskId,
      handlerKey: persistenceEntity.handlerKey,
      startTime: persistenceEntity.startedAt,
      endTime: persistenceEntity.completedAt,
      status: persistenceEntity.status,
      logs: persistenceEntity.result,
      error: persistenceEntity.error
    });
  },
  toDomainList: (persistenceEntities) => {
    return persistenceEntities.map(e => taskExecutionMapper.toDomain(e));
  }
};
