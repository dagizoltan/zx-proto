import { FeedItemSchema } from '../schemas/feed-item.schema.js';
import { createFeedItem } from '../../../domain/entities/feed-item.js';
export const feedItemMapper = {
  toDomain: (dbModel) => { if (!dbModel) return null; return createFeedItem(dbModel); },
  toPersistence: (domainEntity) => FeedItemSchema.parse({
        id: domainEntity.id,
        tenantId: domainEntity.tenantId,
        channelId: domainEntity.channelId,
        content: domainEntity.content,
        authorId: domainEntity.authorId,
        createdAt: domainEntity.createdAt,
        type: domainEntity.type
  }),
  toDomainList: (dbModels) => dbModels.map(feedItemMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(feedItemMapper.toPersistence)
};
