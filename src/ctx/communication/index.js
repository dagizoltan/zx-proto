import { createKVFeedRepository } from './infrastructure/adapters/kv-feed-repository.adapter.js';
import { createKVNotificationRepository } from './infrastructure/adapters/kv-notification-repository.adapter.js';
import { createKVConversationRepository } from './infrastructure/adapters/kv-conversation-repository.adapter.js';
import { createKVMessageRepository } from './infrastructure/adapters/kv-message-repository.adapter.js';

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
                list: createListNotifications({ notificationRepository: notificationRepo }),
                notify: notificationService.notify // Expose service method as use case
            },
            postFeedItem: createPostFeedItem({ feedRepository: feedRepo, eventBus }),
            sendMessage: createSendMessage({ conversationRepository: conversationRepo, messageRepository: messageRepo, eventBus })
        }
    };
};
