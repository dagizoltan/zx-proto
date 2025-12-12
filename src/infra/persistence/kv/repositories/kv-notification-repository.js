import { createRepository } from '../../../../../lib/trust/repo.js';
import { useSchema } from '../../../../../lib/trust/middleware/schema.js';
import { useIndexing } from '../../../../../lib/trust/middleware/indexing.js';
import { NotificationSchema } from '../../../../ctx/communication/domain/schemas/communication.schema.js';

export const createKVNotificationRepository = (kv) => {
    return createRepository(
        kv,
        'notifications',
        [
            useSchema(NotificationSchema),
            useIndexing((notification) => {
                const indexes = [];
                if (notification.userId) {
                    indexes.push({ key: ['notifications_by_user', notification.userId], value: notification.id });
                }
                if (notification.userId && notification.read !== undefined) {
                     indexes.push({ key: ['notifications_by_user_read', notification.userId, String(notification.read)], value: notification.id });
                }
                if (notification.createdAt) {
                    indexes.push({ key: ['notifications_by_date', notification.createdAt], value: notification.id });
                }
                return indexes;
            })
        ]
    );
};
