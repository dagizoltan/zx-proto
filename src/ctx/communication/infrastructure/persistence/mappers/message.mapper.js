import { MessageSchema } from '../schemas/message.schema.js';
import { createMessage } from '../../../domain/entities/message.js';
export const messageMapper = {
  toDomain: (dbModel) => { if (!dbModel) return null; return createMessage(dbModel); },
  toPersistence: (domainEntity) => MessageSchema.parse({
        id: domainEntity.id,
        tenantId: domainEntity.tenantId,
        conversationId: domainEntity.conversationId,
        senderId: domainEntity.senderId,
        content: domainEntity.content,
        createdAt: domainEntity.createdAt
  }),
  toDomainList: (dbModels) => dbModels.map(messageMapper.toDomain).filter(Boolean),
  toPersistenceList: (domainEntities) => domainEntities.map(messageMapper.toPersistence)
};
