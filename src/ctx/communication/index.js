import { createKVFeedRepository } from '../../infra/persistence/kv/repositories/kv-feed-repository.js';
import { createKVNotificationRepository } from '../../infra/persistence/kv/repositories/kv-notification-repository.js';
import { createKVConversationRepository } from '../../infra/persistence/kv/repositories/kv-conversation-repository.js';
import { createKVMessageRepository } from '../../infra/persistence/kv/repositories/kv-message-repository.js';

import { createNotificationService } from './domain/services/notification-service.js';

// Use Cases
import { createGetFeed } from './application/use-cases/get-feed.js';
import { createListConversations } from './application/use-cases/list-conversations.js';
import { createGetConversation } from './application/use-cases/get-conversation.js';
import { createListNotifications } from './application/use-cases/list-notifications.js';
import { createPostFeedItem } from './application/use-cases/post-feed-item.js';
import { createSendMessage } from './application/use-cases/send-message.js';

export const createCommunicationContext = (deps) => {
    const { persistence, messaging } = deps;
    const { kvPool } = persistence;
    const { eventBus } = messaging;

    const feedRepo = createKVFeedRepository(kvPool);
    const notificationRepo = createKVNotificationRepository(kvPool);
    const conversationRepo = createKVConversationRepository(kvPool);
    const messageRepo = createKVMessageRepository(kvPool);

    const notificationService = createNotificationService({ notificationRepo, eventBus });

    return {
        repositories: {
            feed: feedRepo,
            notifications: notificationRepo,
            conversations: conversationRepo,
            messages: messageRepo
        },
        services: {
            notification: notificationService
        },
        useCases: {
            getFeed: createGetFeed({ feedRepository: feedRepo }),
            listConversations: createListConversations({ conversationRepository: conversationRepo }),
            getConversation: createGetConversation({ conversationRepository: conversationRepo, messageRepository: messageRepo }),
            notifications: {
                list: createListNotifications({ notificationRepository: notificationRepo })
            },
            postFeedItem: createPostFeedItem({ feedRepository: feedRepo, eventBus }),
            sendMessage: createSendMessage({ conversationRepository: conversationRepo, messageRepository: messageRepo, eventBus })
        }
    };
};
