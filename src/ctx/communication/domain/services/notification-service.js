import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createNotificationService = ({ notificationRepo, eventBus }) => {
    const notify = async (tenantId, { userId, title, message, level = 'INFO', link }) => {
        const notif = {
            id: crypto.randomUUID(),
            tenantId,
            userId,
            title,
            message,
            level,
            link,
            read: false,
            createdAt: new Date().toISOString()
        };
        const res = await notificationRepo.save(tenantId, notif);
        if (isErr(res)) return res;

        // Publish event for SSE
        if (eventBus) {
             await eventBus.publish('notification.created', notif);
        }
        return Ok(notif);
    };

    const list = async (tenantId, { userId, limit, cursor }) => {
        // Query by user index
        return await notificationRepo.queryByIndex(tenantId, 'user', userId, { limit, cursor });
    };

    const markAsRead = async (tenantId, id) => {
        const res = await notificationRepo.findById(tenantId, id);
        if (isErr(res)) return res;
        const notif = res.value;
        if (!notif) return Err({ code: 'NOT_FOUND' });

        return await notificationRepo.save(tenantId, { ...notif, read: true });
    };

    return { notify, list, markAsRead };
};
