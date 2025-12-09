// Feed Service
export const createFeedService = ({ feedRepository }) => {
    return {
        getFeed: async (tenantId, { limit, cursor }) => {
            return await feedRepository.list(tenantId, { limit, cursor });
        },
        postItem: async (tenantId, item) => {
             const feedItem = {
                 id: item.id || crypto.randomUUID(),
                 type: item.type || 'MANUAL',
                 title: item.title,
                 message: item.message,
                 author: item.author || 'System',
                 link: item.link || null,
                 createdAt: item.createdAt || new Date().toISOString(),
                 metadata: item.metadata || {}
             };
             return await feedRepository.save(tenantId, feedItem);
        }
    };
};

// Conversation Service
export const createConversationService = ({ conversationRepository, messageRepository }) => {
    return {
        listConversations: async (tenantId, { limit, cursor }) => {
            return await conversationRepository.list(tenantId, { limit, cursor });
        },
        getConversation: async (tenantId, conversationId) => {
            const conversation = await conversationRepository.findById(tenantId, conversationId);
            if (!conversation) return null;

            const { items: messages } = await messageRepository.listByConversation(tenantId, conversationId, { limit: 100 }); // Simple limit for now
            return {
                ...conversation,
                messages
            };
        },
        sendMessage: async (tenantId, { conversationId, from, content, to }) => {
            let conversation;

            if (conversationId) {
                conversation = await conversationRepository.findById(tenantId, conversationId);
            }

            // Start new conversation if ID not provided or not found
            if (!conversation) {
                 conversation = {
                     id: conversationId || crypto.randomUUID(),
                     participants: [from, ...(to ? (Array.isArray(to) ? to : [to]) : [])],
                     subject: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
                     updatedAt: new Date().toISOString(),
                     lastMessage: content,
                     lastSender: from
                 };
            } else {
                conversation.updatedAt = new Date().toISOString();
                conversation.lastMessage = content;
                conversation.lastSender = from;
            }

            const message = {
                id: crypto.randomUUID(),
                conversationId: conversation.id,
                from,
                content,
                createdAt: new Date().toISOString()
            };

            await messageRepository.save(tenantId, message);
            await conversationRepository.save(tenantId, conversation);

            return message;
        }
    };
};

// Notification Service
export const createNotificationService = ({ notificationRepo }) => {
  const notify = async (tenantId, notification) => {
    const notif = {
      id: crypto.randomUUID(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    };
    return await notificationRepo.save(tenantId, notif);
  };

  const list = async (tenantId, params) => {
    return await notificationRepo.findAll(tenantId, params);
  };

  const markAsRead = async (tenantId, id) => {
      const notif = await notificationRepo.findById(tenantId, id);
      if (notif) {
          notif.read = true;
          await notificationRepo.save(tenantId, notif);
      }
      return notif;
  };

  return { notify, list, markAsRead };
};
