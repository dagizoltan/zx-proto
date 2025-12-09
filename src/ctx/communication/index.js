import { createKVFeedRepository, createKVMessageRepository, createKVNotificationRepository, createKVConversationRepository } from './domain/repositories/repositories.js';
import { createFeedService, createConversationService, createNotificationService } from './domain/services/services.js';

export const createCommunicationContext = (deps) => {
    const kvPool = deps.persistence.kvPool;
    const eventBus = deps.messaging ? deps.messaging.eventBus : null;

    // Repos
    const feedRepo = createKVFeedRepository(kvPool);
    const messageRepo = createKVMessageRepository(kvPool);
    const notificationRepo = createKVNotificationRepository(kvPool);
    const conversationRepo = createKVConversationRepository(kvPool);

    // Services
    const feedService = createFeedService({ feedRepository: feedRepo });
    const conversationService = createConversationService({ conversationRepository: conversationRepo, messageRepository: messageRepo });
    const notificationService = createNotificationService({ notificationRepo });

    // Listener for System Events -> Feed
    if (eventBus) {
        import('./application/listeners/communication-listener.js').then(({ createCommunicationListener }) => {
             const listener = createCommunicationListener({ feedService, eventBus });
             listener.setupSubscriptions();
        });
    }

    return {
        repositories: {
            feed: feedRepo,
            messages: messageRepo,
            notifications: notificationRepo,
            conversations: conversationRepo
        },
        useCases: {
            // Feed
            getFeed: feedService.getFeed,
            postFeedItem: feedService.postItem,

            // Conversations (Replaces simple messages)
            listConversations: conversationService.listConversations,
            getConversation: conversationService.getConversation,
            sendMessage: conversationService.sendMessage,

            // Notifications
            notifications: notificationService
        }
    };
};
