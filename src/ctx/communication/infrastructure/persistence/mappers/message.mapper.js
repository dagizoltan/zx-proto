import { createMessage } from '../../../domain/entities/message.js';

export const messageMapper = {
  toPersistence: (domainEntity) => {
    return {
      id: domainEntity.id,
      tenantId: domainEntity.tenantId,
      conversationId: domainEntity.conversationId,
      senderId: domainEntity.senderId,
      content: domainEntity.content,
      createdAt: domainEntity.createdAt
    };
  },
  toDomain: (persistenceEntity) => {
    return createMessage({
      id: persistenceEntity.id,
      tenantId: persistenceEntity.tenantId,
      conversationId: persistenceEntity.conversationId,
      senderId: persistenceEntity.senderId,
      content: persistenceEntity.content,
      createdAt: persistenceEntity.createdAt
    });
  },
  toDomainList: (persistenceEntities) => {
    return persistenceEntities.map(e => messageMapper.toDomain(e));
  }
};
