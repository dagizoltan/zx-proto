
import { ShipmentCreated, ShipmentShipped } from './domain/index.js';

export const createShipmentProjector = (kvPool) => {

    // View: ['view', 'shipments', tenantId, shipmentId]

    const handle = async (event) => {
        const { tenantId, data, type, id: eventId } = event;
        const shipmentId = data.shipmentId;

        if (!shipmentId) return;

        await kvPool.withConnection(async (kv) => {
            // Idempotency
            const processedKey = ['processed', eventId];
            const processedRes = await kv.get(processedKey);
            if (processedRes.value) return;

            const key = ['view', 'shipments', tenantId, shipmentId];
            const currentRes = await kv.get(key);
            const currentDoc = currentRes.value || {};

            let update = {};

            switch (type) {
                case ShipmentCreated:
                    update = {
                        id: shipmentId,
                        tenantId,
                        orderId: data.orderId,
                        items: data.items,
                        address: data.address,
                        status: 'PREPARING',
                        createdAt: data.createdAt,
                        updatedAt: Date.now()
                    };
                    break;
                case ShipmentShipped:
                    update = {
                        ...currentDoc,
                        status: 'SHIPPED',
                        trackingNumber: data.trackingNumber,
                        carrier: data.carrier,
                        shippedAt: data.shippedAt,
                        updatedAt: Date.now()
                    };
                    break;
            }

            const atomic = kv.atomic();
            atomic.check(currentRes);
            atomic.set(key, update);
            atomic.set(processedKey, true, { expireIn: 1000 * 60 * 60 * 24 * 7 });

            const res = await atomic.commit();
            if (!res.ok) throw new Error("Failed to update shipment view");
        });
    };

    return {
        handle
    };
};
