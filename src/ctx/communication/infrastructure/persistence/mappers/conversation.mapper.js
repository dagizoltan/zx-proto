import { ConversationSchema } from '../schemas/conversation.schema.js';
import { createConversation } from '../../../domain/entities/conversation.js';
export const conversationMapper = {
  toDomain: (dbModel) => { if (!dbModel) return null; return createConversation(dbModel); },
  toPersistence: (domainEntity) => ConversationSchema.parse({
        id: domainEntity.id,
        tenantId: domainEntity.tenantId,
        participantIds: domainEntity.participantIds,
        lastMessagePreview: domainEntity.lastMessagePreview,
        updatedAt: domainEntity.updatedAt
  }),
  toDomainList: (dbModels) => dbModels.map(conversationMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(conversationMapper.toPersistence)
};
