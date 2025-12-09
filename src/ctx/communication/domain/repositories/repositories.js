import { createBaseRepository } from '../../../../infra/persistence/kv/repositories/base-repository.js';

export const createKVFeedRepository = (kvPool) => {
    const base = createBaseRepository(kvPool, 'feed', 'feed');

    // Key: ['tenants', tenantId, 'feed', timestamp_desc, id]
    const list = async (tenantId, { limit = 20, cursor } = {}) => {
         return kvPool.withConnection(async (kv) => {
            const selector = {
                prefix: ['tenants', tenantId, 'feed']
            };
            const iter = kv.list(selector, { limit, cursor });
            const items = [];
            for await (const res of iter) {
                items.push(res.value);
            }
            return {
                items,
                nextCursor: items.length === limit ? iter.cursor : null
            };
        });
    };

    const save = async (tenantId, item) => {
        return kvPool.withConnection(async (kv) => {
            const timestamp = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
            const timestampDesc = Number.MAX_SAFE_INTEGER - timestamp;
            const key = ['tenants', tenantId, 'feed', timestampDesc, item.id];
            await kv.set(key, item);
            return item;
        });
    };

    return { list, save };
};

export const createKVConversationRepository = (kvPool) => {
    // Stores conversation metadata: participants, lastMessage, updatedAt
    // Key: ['tenants', tenantId, 'conversations', updatedAtDesc, conversationId]

    const list = async (tenantId, { limit = 20, cursor } = {}) => {
        return kvPool.withConnection(async (kv) => {
           const selector = {
               prefix: ['tenants', tenantId, 'conversations']
           };
           const iter = kv.list(selector, { limit, cursor });
           const items = [];
           for await (const res of iter) {
               items.push(res.value);
           }
           return {
               items,
               nextCursor: items.length === limit ? iter.cursor : null
           };
       });
    };

    const save = async (tenantId, conversation) => {
         return kvPool.withConnection(async (kv) => {
             const timestamp = conversation.updatedAt ? new Date(conversation.updatedAt).getTime() : Date.now();
             const timestampDesc = Number.MAX_SAFE_INTEGER - timestamp;
             // We use updatedAtDesc so active conversations float to top
             const key = ['tenants', tenantId, 'conversations', timestampDesc, conversation.id];

             // Also need to be able to find by ID efficiently if we just have ID?
             // KV doesn't support easy "find by ID if key has dynamic segments" without index.
             // We might need a direct lookup key: ['tenants', tenantId, 'conversations_by_id', id] -> points to main key or data
             // For simplicity, let's store data at BOTH or use just one if list is primary.
             // Let's store direct lookup too for getById.

             await kv.atomic()
                .set(key, conversation)
                .set(['tenants', tenantId, 'conversations_by_id', conversation.id], conversation)
                .commit();
             return conversation;
         });
    };

    const findById = async (tenantId, id) => {
         return kvPool.withConnection(async (kv) => {
             const res = await kv.get(['tenants', tenantId, 'conversations_by_id', id]);
             return res.value;
         });
    };

    return { list, save, findById };
};

export const createKVMessageRepository = (kvPool) => {
    // Stores messages within a conversation
    // Key: ['tenants', tenantId, 'messages', conversationId, timestamp, messageId]

    const listByConversation = async (tenantId, conversationId, { limit = 50, cursor } = {}) => {
        return kvPool.withConnection(async (kv) => {
            const selector = {
                prefix: ['tenants', tenantId, 'messages', conversationId]
            };
            const iter = kv.list(selector, { limit, cursor });
            const items = [];
            for await (const res of iter) {
                items.push(res.value);
            }
            return {
                items,
                nextCursor: items.length === limit ? iter.cursor : null
            };
        });
    };

    const save = async (tenantId, message) => {
        return kvPool.withConnection(async (kv) => {
            const timestamp = message.createdAt ? new Date(message.createdAt).getTime() : Date.now();
            const key = ['tenants', tenantId, 'messages', message.conversationId, timestamp, message.id];
            await kv.set(key, message);
            return message;
        });
    };

    return { listByConversation, save };
};

export const createKVNotificationRepository = (kvPool) => {
     const base = createBaseRepository(kvPool, 'notifications', 'notification');
     return base;
};
