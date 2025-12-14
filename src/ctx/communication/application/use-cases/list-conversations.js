import { Ok, isErr } from '../../../../../lib/trust/index.js';

export const createListConversations = ({ conversationRepository, identityAdapter }) => {
    return async (tenantId, options = {}) => {
        const res = await conversationRepository.query(tenantId, options);
        if (isErr(res)) return { items: [] };

        // Clone items to avoid "object is not extensible" error
        const items = res.value.items.map(item => ({ ...item }));

        // Enrichment
        if (identityAdapter && items.length > 0) {
            const userIds = new Set();
            items.forEach(c => c.participantIds?.forEach(id => userIds.add(id)));

            if (userIds.size > 0) {
                const usersRes = await identityAdapter.getUsersByIds(tenantId, Array.from(userIds));
                if (!isErr(usersRes)) {
                    const userMap = new Map(usersRes.value.map(u => [u.id, u.name]));

                    for (const conv of items) {
                         conv.participants = (conv.participantIds || []).map(id => userMap.get(id) || id);
                         // Placeholder for last sender, could be enriched if we had the ID
                         conv.lastSender = 'Someone';
                    }
                }
            }
        }

        // Fallback if enrichment failed or no adapter
        for (const conv of items) {
            if (!conv.participants) {
                conv.participants = conv.participantIds || [];
            }
        }

        return { items };
    };
};
