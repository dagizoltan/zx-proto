import { createKVFeedRepository } from '../../infra/persistence/kv/repositories/kv-feed-repository.js';
import { createKVNotificationRepository } from '../../infra/persistence/kv/repositories/kv-notification-repository.js';
import { createKVConversationRepository } from '../../infra/persistence/kv/repositories/kv-conversation-repository.js';
import { createKVMessageRepository } from '../../infra/persistence/kv/repositories/kv-message-repository.js';

import { createNotificationService } from './domain/services/notification-service.js';

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
        // TEMPORARY: Removed broken use cases until implementation is restored
        useCases: {
            // postFeedItem: createPostFeedItem({ feedRepository: feedRepo, eventBus }),
            // sendMessage: createSendMessage({ conversationRepository: conversationRepo, messageRepository: messageRepo, eventBus })
        }
    };
};
