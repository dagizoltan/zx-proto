import { createRepository } from '../../../../../lib/trust/repo.js';
import { useSchema } from '../../../../../lib/trust/middleware/schema.js';
import { useIndexing } from '../../../../../lib/trust/middleware/indexing.js';
import { MessageSchema } from '../../../../ctx/communication/domain/schemas/communication.schema.js';

export const createKVMessageRepository = (kv) => {
    return createRepository(
        kv,
        'messages',
        [
            useSchema(MessageSchema),
            useIndexing((message) => {
                const indexes = [];
                if (message.conversationId) {
                    indexes.push({ key: ['messages_by_conversation', message.conversationId], value: message.id });
                }
                if (message.createdAt) {
                    indexes.push({ key: ['messages_by_date', message.createdAt], value: message.id });
                }
                return indexes;
            })
        ]
    );
};
