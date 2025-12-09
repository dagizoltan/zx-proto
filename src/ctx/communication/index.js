import { createKVFeedRepository, createKVMessageRepository, createKVNotificationRepository } from './domain/repositories/repositories.js';
import { createFeedService, createMessageService, createNotificationService } from './domain/services/services.js';

export const createCommunicationContext = (deps) => {
    const kvPool = deps.persistence.kvPool;
    const eventBus = deps.messaging ? deps.messaging.eventBus : null;

    // Repos
    const feedRepo = createKVFeedRepository(kvPool);
    const messageRepo = createKVMessageRepository(kvPool);
    const notificationRepo = createKVNotificationRepository(kvPool);

    // Services
    const feedService = createFeedService({ feedRepository: feedRepo });
    const messageService = createMessageService({ messageRepository: messageRepo });
    const notificationService = createNotificationService({ notificationRepo });

    // Listener for System Events -> Feed
    if (eventBus) {
        // We can subscribe to generic events and post to feed
        // For example, high-level business events.
        // Let's create a listener file or inline it here for simplicity given scope.
        // The plan mentioned a listener. Let's create it properly.
        import('./application/listeners/communication-listener.js').then(({ createCommunicationListener }) => {
             const listener = createCommunicationListener({ feedService, eventBus });
             listener.setupSubscriptions();
        });
    }

    return {
        repositories: {
            feed: feedRepo,
            messages: messageRepo,
            notifications: notificationRepo
        },
        useCases: {
            // Feed
            getFeed: feedService.getFeed,
            postFeedItem: feedService.postItem,

            // Messages
            listMessages: messageService.listMessages,
            sendMessage: messageService.sendMessage,

            // Notifications
            notifications: notificationService
            // exposing the service directly as it matches the old system signature roughly
        }
    };
};
