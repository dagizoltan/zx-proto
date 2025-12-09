// Feed Service
export const createFeedService = ({ feedRepository }) => {
    return {
        getFeed: async (tenantId, { limit, cursor }) => {
            return await feedRepository.list(tenantId, { limit, cursor });
        },
        postItem: async (tenantId, item) => {
             // item: { id, type, title, message, author, link, createdAt }
             // type: 'MANUAL' | 'SYSTEM'
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

// Message Service
export const createMessageService = ({ messageRepository }) => {
    return {
        listMessages: async (tenantId, { limit, cursor }) => {
            // Base repo 'findAll'
            return await messageRepository.findAll(tenantId, { limit, cursor });
        },
        sendMessage: async (tenantId, { from, to, content }) => {
            const message = {
                id: crypto.randomUUID(),
                from, // userId or 'system'
                to,   // userId or 'all'
                content,
                read: false,
                createdAt: new Date().toISOString()
            };
            return await messageRepository.save(tenantId, message);
        }
    };
};

// Notification Service (Migrated)
export const createNotificationService = ({ notificationRepo }) => {
  const notify = async (tenantId, notification) => {
    const notif = {
      id: crypto.randomUUID(),
      ...notification, // { level, title, message, link }
      read: false,
      createdAt: new Date().toISOString()
    };

    // In a real app we might push to SSE here too.
    // For now just save to repo.
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
