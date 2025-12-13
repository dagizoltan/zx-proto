import { createConversation } from '../../../domain/entities/conversation.js';

export const conversationMapper = {
  toPersistence: (domainEntity) => {
    return {
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      participantIds: domainEntity.participantIds,
      lastMessagePreview: domainEntity.lastMessagePreview,
      updatedAt: domainEntity.updatedAt
    };
  },
  toDomain: (persistenceEntity) => {
    return createConversation({
      id: persistenceEntity.id,
      tenantId: persistenceEntity.tenantId,
      participantIds: persistenceEntity.participantIds,
      lastMessagePreview: persistenceEntity.lastMessagePreview,
      updatedAt: persistenceEntity.updatedAt
    });
  },
  toDomainList: (persistenceEntities) => {
    return persistenceEntities.map(e => conversationMapper.toDomain(e));
  }
};
