import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { MessageSchema } from '../../../../ctx/communication/domain/schemas/communication.schema.js';

export const createKVMessageRepository = (kvPool) => {
    return createRepository(kvPool, 'messages', [
        useSchema(MessageSchema),
        useIndexing({
            'conversation': (m) => m.conversationId,
            'timestamp': (m) => m.createdAt
        })
    ]);
};
