import { Ok, isErr } from '../../../../../lib/trust/index.js';

export const createListNotifications = ({ notificationRepository }) => {
    return async (tenantId, options = {}) => {
        const res = await notificationRepository.query(tenantId, options);
        if (isErr(res)) return { items: [] };
        return res.value;
    };
};
