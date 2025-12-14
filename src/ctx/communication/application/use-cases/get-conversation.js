import { Ok, isErr } from '../../../../../lib/trust/index.js';

export const createGetConversation = ({ conversationRepository, messageRepository, identityAdapter }) => {
    return async (tenantId, id) => {
        const res = await conversationRepository.findById(tenantId, id);
        if (isErr(res)) return null;

        const rawConversation = res.value;
        if (!rawConversation) return null;

        // Clone conversation to allow mutation
        const conversation = { ...rawConversation };

        const msgsRes = await messageRepository.queryByIndex(tenantId, 'conversation', id, { limit: 100 });
        // Clone messages as well
        const messages = isErr(msgsRes) ? [] : msgsRes.value.items.map(m => ({ ...m }));

        // Enrichment
        if (identityAdapter && conversation.participantIds?.length > 0) {
             const usersRes = await identityAdapter.getUsersByIds(tenantId, conversation.participantIds);
             if (!isErr(usersRes)) {
                 const userMap = new Map(usersRes.value.map(u => [u.id, u.name]));
                 conversation.participants = conversation.participantIds.map(id => userMap.get(id) || id);

                 // Also enrich messages?
                 // It's expensive to do it here for 100 messages if not bulked,
                 // but we already fetched all participants of the conversation.
                 // Usually message authors are participants.
                 messages.forEach(m => {
                     m.authorName = userMap.get(m.from) || m.from;
                 });
             }
        }

        if (!conversation.participants) {
            conversation.participants = conversation.participantIds || [];
        }

        return { ...conversation, messages };
    };
};
