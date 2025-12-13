import { createNotification } from '../../../domain/entities/notification.js';

export const notificationMapper = {
  toPersistence: (domainEntity) => {
    return {
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      userId: domainEntity.userId,
      title: domainEntity.title,
      message: domainEntity.message,
      level: domainEntity.level,
      link: domainEntity.link,
      read: domainEntity.read,
      createdAt: domainEntity.createdAt
    };
  },
  toDomain: (persistenceEntity) => {
    return createNotification({
      id: persistenceEntity.id,
      tenantId: persistenceEntity.tenantId,
      userId: persistenceEntity.userId,
      title: persistenceEntity.title,
      message: persistenceEntity.message,
      level: persistenceEntity.level,
      link: persistenceEntity.link,
      read: persistenceEntity.read,
      createdAt: persistenceEntity.createdAt
    });
  },
  toDomainList: (persistenceEntities) => {
    return persistenceEntities.map(e => notificationMapper.toDomain(e));
  }
};
