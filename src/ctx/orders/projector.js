
import { OrderInitialized, OrderConfirmed, OrderRejected } from './domain.js';

export const createOrderProjector = (kvPool) => {

    // Key Scheme: ['view', 'orders', tenantId, orderId]
    const getViewKey = (tenantId, orderId) => ['view', 'orders', tenantId, orderId];

    const handle = async (event) => {
        const { tenantId, data, type } = event;
        // The event payload has orderId.
        const orderId = data.orderId;

        if (!orderId) {
            console.warn("Projector received event without orderId", event);
            return;
        }

        await kvPool.withConnection(async (kv) => {
            const key = getViewKey(tenantId, orderId);
            const currentRes = await kv.get(key);
            const currentDoc = currentRes.value || {};

            let update = {};

            switch (type) {
                case OrderInitialized:
                    update = {
                        id: orderId,
                        tenantId,
                        customerId: data.customerId,
                        items: data.items,
                        status: data.status,
                        createdAt: data.createdAt,
                        updatedAt: Date.now()
                    };
                    break;
                case OrderConfirmed:
                    update = {
                        ...currentDoc,
                        status: 'CONFIRMED',
                        updatedAt: Date.now()
                    };
                    break;
                case OrderRejected:
                    update = {
                        ...currentDoc,
                        status: 'REJECTED',
                        reason: data.reason,
                        updatedAt: Date.now()
                    };
                    break;
                default:
                    return; // Ignore unknown events
            }

            await kv.set(key, update);
        });
    };

    return {
        handle
    };
};
