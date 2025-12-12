import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { ConversationSchema } from '../../../../ctx/communication/domain/schemas/communication.schema.js';

export const createKVConversationRepository = (kvPool) => {
    return createRepository(kvPool, 'conversations', [
        useSchema(ConversationSchema),
        useIndexing({
            'updatedAt_desc': (c) => c.updatedAt
        })
    ]);
};
