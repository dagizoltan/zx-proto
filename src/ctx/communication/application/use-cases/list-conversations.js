import { Ok, isErr } from '../../../../../lib/trust/index.js';

export const createListConversations = ({ conversationRepository }) => {
    return async (tenantId, options = {}) => {
        const res = await conversationRepository.query(tenantId, options);
        if (isErr(res)) return { items: [] };
        return res.value;
    };
};
