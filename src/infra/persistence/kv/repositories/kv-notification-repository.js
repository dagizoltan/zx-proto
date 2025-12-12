import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { NotificationSchema } from '../../../../ctx/communication/domain/schemas/communication.schema.js';

export const createKVNotificationRepository = (kvPool) => {
    return createRepository(kvPool, 'notifications', [
        useSchema(NotificationSchema),
        useIndexing({
            'user': (n) => n.userId,
            'read': (n) => n.read ? 'true' : 'false',
            'timestamp_desc': (n) => n.createdAt
        })
    ]);
};
