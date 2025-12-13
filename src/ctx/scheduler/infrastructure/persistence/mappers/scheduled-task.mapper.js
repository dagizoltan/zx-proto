import { ScheduledTaskSchema } from '../schemas/scheduled-task.schema.js';
import { createScheduledTask } from '../../../domain/entities/scheduled-task.js';
export const scheduledTaskMapper = {
  toDomain: (dbModel) => { if (!dbModel) return null; return createScheduledTask(dbModel); },
  toPersistence: (domainEntity, tenantId) => {
    const json = domainEntity.toJSON();
    return ScheduledTaskSchema.parse({
        id: json.id,
        tenantId: json.tenantId || tenantId,
        handlerKey: json.handlerKey,
        cronExpression: json.cronExpression,
        enabled: json.enabled,
        lastRunAt: json.lastRunAt,
        createdAt: json.createdAt
    });
  },
  toDomainList: (dbModels) => dbModels.map(scheduledTaskMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(e => scheduledTaskMapper.toPersistence(e))
};
