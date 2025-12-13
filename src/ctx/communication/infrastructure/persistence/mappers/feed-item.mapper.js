import { createFeedItem } from '../../../domain/entities/feed-item.js';

export const feedItemMapper = {
  toPersistence: (domainEntity) => {
    return {
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      channelId: domainEntity.channelId,
      content: domainEntity.content,
      authorId: domainEntity.authorId,
      type: domainEntity.type,
      createdAt: domainEntity.createdAt
    };
  },
  toDomain: (persistenceEntity) => {
    return createFeedItem({
      id: persistenceEntity.id,
      tenantId: persistenceEntity.tenantId,
      channelId: persistenceEntity.channelId,
      content: persistenceEntity.content,
      authorId: persistenceEntity.authorId,
      type: persistenceEntity.type,
      createdAt: persistenceEntity.createdAt
    });
  },
  toDomainList: (persistenceEntities) => {
    return persistenceEntities.map(e => feedItemMapper.toDomain(e));
  }
};
