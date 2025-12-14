import { createKVFeedRepository } from './infrastructure/adapters/kv-feed-repository.adapter.js';
import { createKVNotificationRepository } from './infrastructure/adapters/kv-notification-repository.adapter.js';
import { createKVConversationRepository } from './infrastructure/adapters/kv-conversation-repository.adapter.js';
import { createKVMessageRepository } from './infrastructure/adapters/kv-message-repository.adapter.js';
// Removed: createIdentityAdapter import - injected instead

import { createNotificationService } from './domain/services/notification-service.js';

// Use Cases
import { createGetFeed } from './application/use-cases/get-feed.js';
import { createListConversations } from './application/use-cases/list-conversations.js';
import { createGetConversation } from './application/use-cases/get-conversation.js';
import { createPostFeedItem } from './application/use-cases/post-feed-item.js';
import { createSendMessage } from './application/use-cases/send-message.js';
import { createSubscribeNotifications } from './application/use-cases/subscribe-notifications.js';

/**
 * Communication Context Factory
 *
 * @param {Object} deps - Explicit DI
 * @param {Object} deps.kvPool
 * @param {Object} deps.eventBus
 * @param {Object} deps.identityGateway - Injected Gateway (formerly identityAdapter)
 */
export const createCommunicationContext = ({ kvPool, eventBus, identityGateway }) => {

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
            listConversations: createListConversations({ conversationRepository: conversationRepo, identityAdapter: identityGateway }),
            getConversation: createGetConversation({ conversationRepository: conversationRepo, messageRepository: messageRepo, identityAdapter: identityGateway }),
            notifications: {
                list: notificationService.list,
                notify: notificationService.notify,
                subscribe: createSubscribeNotifications({ eventBus })
            },
            postFeedItem: createPostFeedItem({ feedRepository: feedRepo, eventBus }),
            sendMessage: createSendMessage({ conversationRepository: conversationRepo, messageRepository: messageRepo, eventBus })
        }
    };
};
