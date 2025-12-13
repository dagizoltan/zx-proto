import { createActivity } from '../../../domain/entities/activity.js';

export const activityMapper = {
  toPersistence: (domainEntity) => {
    return {
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      userId: domainEntity.userId,
      action: domainEntity.action,
      resource: domainEntity.resource,
      resourceId: domainEntity.resourceId,
      meta: domainEntity.meta,
      timestamp: domainEntity.timestamp
    };
  },
  toDomain: (persistenceEntity) => {
    return createActivity({
      id: persistenceEntity.id,
      tenantId: persistenceEntity.tenantId,
      userId: persistenceEntity.userId,
      action: persistenceEntity.action,
      resource: persistenceEntity.resource,
      resourceId: persistenceEntity.resourceId,
      meta: persistenceEntity.meta,
      timestamp: persistenceEntity.timestamp
    });
  },
  toDomainList: (persistenceEntities) => {
    return persistenceEntities.map(e => activityMapper.toDomain(e));
  }
};
