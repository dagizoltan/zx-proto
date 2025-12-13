import { NotificationSchema } from '../schemas/notification.schema.js';
import { createNotification } from '../../../domain/entities/notification.js';
export const notificationMapper = {
  toDomain: (dbModel) => { if (!dbModel) return null; return createNotification(dbModel); },
  toPersistence: (domainEntity) => NotificationSchema.parse({
        id: domainEntity.id,
        tenantId: domainEntity.tenantId,
        userId: domainEntity.userId,
        title: domainEntity.title,
        message: domainEntity.message,
        level: domainEntity.level,
        link: domainEntity.link,
        read: domainEntity.read,
        createdAt: domainEntity.createdAt
  }),
  toDomainList: (dbModels) => dbModels.map(notificationMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(notificationMapper.toPersistence)
};
