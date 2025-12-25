
import { StockReceived, StockReserved, StockReleased, StockShipped } from './domain/index.js';

export const createInventoryProjector = (kvPool) => {

    // View Key: ['view', 'inventory', tenantId, productId]
    // Value: { totalQuantity: number, reservedQuantity: number, availableQuantity: number, locations: { ... } }

    const handle = async (event) => {
        const { tenantId, data, type, id: eventId } = event;
        const productId = data.productId;

        if (!productId) return;

        await kvPool.withConnection(async (kv) => {
            const processedKey = ['processed', eventId];
            const processedRes = await kv.get(processedKey);
            if (processedRes.value) return; // Idempotent check

            const key = ['view', 'inventory', tenantId, productId];
            const currentRes = await kv.get(key);
            const currentDoc = currentRes.value || {
                productId,
                totalQuantity: 0,
                reservedQuantity: 0,
                availableQuantity: 0,
                locations: {} // loc-batch -> qty
            };

            const batchKey = (loc, batch) => `${loc}:${batch}`;

            switch (type) {
                case StockReceived: {
                    const k = batchKey(data.locationId, data.batchId);
                    if (!currentDoc.locations[k]) {
                        currentDoc.locations[k] = { quantity: 0, reserved: 0 };
                    }
                    currentDoc.locations[k].quantity += data.quantity;
                    currentDoc.totalQuantity += data.quantity;
                    break;
                }
                case StockReserved: {
                    for (const alloc of data.allocations) {
                        const k = batchKey(alloc.locationId, alloc.batchId);
                        if (currentDoc.locations[k]) {
                            currentDoc.locations[k].reserved += alloc.quantity;
                        }
                        currentDoc.reservedQuantity += alloc.quantity;
                    }
                    break;
                }
                case StockReleased: {
                    for (const alloc of data.allocations) {
                        const k = batchKey(alloc.locationId, alloc.batchId);
                        if (currentDoc.locations[k]) {
                            currentDoc.locations[k].reserved -= alloc.quantity;
                        }
                        currentDoc.reservedQuantity -= alloc.quantity;
                    }
                    break;
                }
                case StockShipped: {
                    for (const alloc of data.allocations) {
                        const k = batchKey(alloc.locationId, alloc.batchId);
                        if (currentDoc.locations[k]) {
                            currentDoc.locations[k].reserved -= alloc.quantity;
                            currentDoc.locations[k].quantity -= alloc.quantity;
                        }
                        currentDoc.reservedQuantity -= alloc.quantity;
                        currentDoc.totalQuantity -= alloc.quantity;
                    }
                    break;
                }
            }

            // Derived
            currentDoc.availableQuantity = currentDoc.totalQuantity - currentDoc.reservedQuantity;
            currentDoc.updatedAt = Date.now();

            const atomic = kv.atomic();
            atomic.check(currentRes);
            atomic.set(key, currentDoc);
            atomic.set(processedKey, true, { expireIn: 1000 * 60 * 60 * 24 * 7 });

            const res = await atomic.commit();
            if (!res.ok) throw new Error("Failed to update inventory view (concurrency)");
        });
    };

    return {
        handle
    };
};
