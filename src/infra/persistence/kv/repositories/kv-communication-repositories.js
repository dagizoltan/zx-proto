import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { FeedItemSchema, NotificationSchema, ConversationSchema, MessageSchema } from '../../../../ctx/communication/domain/schemas/communication.schema.js';

export const createKVFeedRepository = (kvPool) => {
    return createRepository(kvPool, 'feed', [
        useSchema(FeedItemSchema),
        useIndexing({
            'channel': (f) => f.channelId,
            'timestamp_desc': (f) => f.createdAt
        })
    ]);
};

export const createKVNotificationRepository = (kvPool) => {
    return createRepository(kvPool, 'notifications', [
        useSchema(NotificationSchema),
        useIndexing({
            'user': (n) => n.userId,
            'read': (n) => n.read ? 'true' : 'false',
            'timestamp_desc': (n) => n.createdAt
        })
    ]);
};

export const createKVConversationRepository = (kvPool) => {
    return createRepository(kvPool, 'conversations', [
        useSchema(ConversationSchema),
        useIndexing({
            'updatedAt_desc': (c) => c.updatedAt
        })
    ]);
};

export const createKVMessageRepository = (kvPool) => {
    return createRepository(kvPool, 'messages', [
        useSchema(MessageSchema),
        useIndexing({
            'conversation': (m) => m.conversationId,
            'timestamp': (m) => m.createdAt
        })
    ]);
};
