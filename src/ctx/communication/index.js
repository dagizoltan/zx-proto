import {
    createKVFeedRepository,
    createKVNotificationRepository,
    createKVConversationRepository,
    createKVMessageRepository
} from '../../infra/persistence/kv/repositories/kv-communication-repositories.js';

import { createPostFeedItem } from './application/use-cases/post-feed-item.js';
import { createSendMessage } from './application/use-cases/send-message.js';
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
        useCases: {
            postFeedItem: createPostFeedItem({ feedRepository: feedRepo, eventBus }),
            sendMessage: createSendMessage({ conversationRepository: conversationRepo, messageRepository: messageRepo, eventBus })
        }
    };
};
