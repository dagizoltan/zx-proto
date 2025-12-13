import { createScheduledTask } from '../../../domain/entities/scheduled-task.js';

export const scheduledTaskMapper = {
  toPersistence: (domainEntity) => {
    // domainEntity might be a frozen object from factory or a plain object if coming from other sources
    // factory uses 'cronExpression', schema uses 'schedule'
    const json = domainEntity.toJSON ? domainEntity.toJSON() : domainEntity;
    return {
      id: json.id,
      tenantId: json.tenantId || 'default', // Add tenantId if missing as schema might expect it
      handlerKey: json.handlerKey,
      name: json.name,
      description: json.description,
      schedule: json.cronExpression || json.schedule,
      enabled: json.enabled,
      lastRunAt: json.lastRunAt,
      nextRunAt: json.nextRunAt,
      status: json.status,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt
    };
  },
  toDomain: (persistenceEntity) => {
    return createScheduledTask({
      id: persistenceEntity.id,
      tenantId: persistenceEntity.tenantId,
      handlerKey: persistenceEntity.handlerKey,
      name: persistenceEntity.name,
      description: persistenceEntity.description,
      cronExpression: persistenceEntity.schedule,
      enabled: persistenceEntity.enabled,
      lastRunAt: persistenceEntity.lastRunAt,
      nextRunAt: persistenceEntity.nextRunAt,
      status: persistenceEntity.status,
      createdAt: persistenceEntity.createdAt,
      updatedAt: persistenceEntity.updatedAt
    });
  },
  toDomainList: (persistenceEntities) => {
    return persistenceEntities.map(e => scheduledTaskMapper.toDomain(e));
  }
};
