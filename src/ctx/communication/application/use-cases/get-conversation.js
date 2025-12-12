import { Ok, isErr } from '../../../../../lib/trust/index.js';

export const createGetConversation = ({ conversationRepository, messageRepository }) => {
    return async (tenantId, id) => {
        const res = await conversationRepository.findById(tenantId, id);
        if (isErr(res)) return null;

        const conversation = res.value;
        if (!conversation) return null;

        const msgsRes = await messageRepository.queryByIndex(tenantId, 'conversation', id, { limit: 100 });
        const messages = isErr(msgsRes) ? [] : msgsRes.value.items;

        return { ...conversation, messages };
    };
};
