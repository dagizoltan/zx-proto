
import { OrderInitialized, OrderConfirmed, OrderRejected } from './domain.js';

export const createOrderProjector = (kvPool) => {

    // Key Scheme: ['view', 'orders', tenantId, orderId]
    const getViewKey = (tenantId, orderId) => ['view', 'orders', tenantId, orderId];

    // Idempotency Key: ['processed', eventId]
    const getProcessedKey = (eventId) => ['processed', eventId];

    const handle = async (event) => {
        const { tenantId, data, type, id: eventId } = event;
        // The event payload has orderId.
        const orderId = data.orderId;

        if (!orderId) {
            console.warn("Projector received event without orderId", event);
            return;
        }

        await kvPool.withConnection(async (kv) => {
            const processedKey = getProcessedKey(eventId);
            const processedRes = await kv.get(processedKey);

            // ADR-007: Idempotency Check
            if (processedRes.value) {
                // Already processed
                return;
            }

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

            // Atomic Commit: Update View AND Mark Event as Processed
            const atomic = kv.atomic();
            atomic.check(currentRes);
            atomic.set(key, update);
            atomic.set(processedKey, true, { expireIn: 1000 * 60 * 60 * 24 * 7 }); // Expire after 7 days? Or keep forever?
            // ADR-004 says Disposable Read Models.
            // If we rebuild, we clear 'view' and 'processed'.

            const res = await atomic.commit();
            if (!res.ok) {
                // Race condition on view update? Retry?
                // For simplicity in MVP, we log.
                // In production, we should throw to let Queue retry.
                throw new Error("Failed to update view (concurrency)");
            }
        });
    };

    return {
        handle
    };
};
