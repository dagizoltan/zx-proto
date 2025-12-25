
import { StockReceived, StockReserved, StockReleased, StockShipped } from './domain/index.js';

export const createInventoryProjector = (kvPool) => {

    // View Key: ['view', 'inventory', tenantId, productId]
    // Value: { totalQuantity: number, reservedQuantity: number, availableQuantity: number, locations: { ... } }

    const handle = async (event) => {
        const { tenantId, data, type } = event;
        const productId = data.productId;

        if (!productId) return;

        await kvPool.withConnection(async (kv) => {
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

            await kv.set(key, currentDoc);
        });
    };

    return {
        handle
    };
};
