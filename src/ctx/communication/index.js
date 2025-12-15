import { createKVFeedRepository } from './infrastructure/adapters/kv-feed-repository.adapter.js';
import { createKVNotificationRepository } from './infrastructure/adapters/kv-notification-repository.adapter.js';
import { createKVConversationRepository } from './infrastructure/adapters/kv-conversation-repository.adapter.js';
import { createKVMessageRepository } from './infrastructure/adapters/kv-message-repository.adapter.js';
import { createNotificationService } from './domain/services/notification-service.js';

import { createGetFeed } from './application/use-cases/get-feed.js';
import { createListConversations } from './application/use-cases/list-conversations.js';
import { createGetConversation } from './application/use-cases/get-conversation.js';
import { createPostFeedItem } from './application/use-cases/post-feed-item.js';
import { createSendMessage } from './application/use-cases/send-message.js';
import { createSubscribeNotifications } from './application/use-cases/subscribe-notifications.js';

import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';
import { createIdentityAdapter } from './infrastructure/adapters/identity.adapter.js';

export const createCommunicationContext = async (deps) => {
    const { kvPool, eventBus } = resolveDependencies(deps, {
        kvPool: ['persistence.kvPool', 'kvPool'],
        eventBus: ['messaging.eventBus', 'eventBus']
    });

    const identityGateway = createIdentityAdapter(deps['access-control']);

    const feedRepo = createKVFeedRepository(kvPool);
    const notificationRepo = createKVNotificationRepository(kvPool);
    const conversationRepo = createKVConversationRepository(kvPool);
    const messageRepo = createKVMessageRepository(kvPool);

    const notificationService = createNotificationService({ notificationRepo, eventBus });

    return createContextBuilder('communication')
        .withRepositories({
            feed: feedRepo,
            notifications: notificationRepo,
            conversations: conversationRepo,
            messages: messageRepo
        })
        .withServices({
            notification: notificationService
        })
        .withUseCases({
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
        })
        .build();
};

export const CommunicationContext = {
    name: 'communication',
    dependencies: [
        'infra.persistence',
        'infra.messaging',
        'domain.access-control'
    ],
    factory: createCommunicationContext
};
