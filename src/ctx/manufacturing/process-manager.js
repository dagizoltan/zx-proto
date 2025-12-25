
import { ProductionCompleted, ProductionScheduled } from './domain/index.js';
import { ReserveStock, ReceiveStock } from '../inventory/domain/index.js';

export const createManufacturingProcessManager = (manufacturingCommandBus, inventoryCommandBus, kvPool) => {

    const handle = async (event) => {
        const { type, id: eventId } = event;

        // Idempotency
        if (kvPool && eventId) {
            const key = ['saga', 'manufacturing', eventId, type];
            const res = await kvPool.withConnection(kv => kv.get(key));
            if (res.value) return;

            // Mark as processed immediately?
            // Better: Mark after successful handling.
            // Risk: If handling fails (e.g. command bus error), we retry.
            // If we mark before, we skip retry.
            // Let's mark after.
        }

        if (type === ProductionCompleted) {
            await handleProductionCompleted(event);
        }

        if (kvPool && eventId) {
            const key = ['saga', 'manufacturing', eventId, type];
            await kvPool.withConnection(kv => kv.set(key, true, { expireIn: 1000 * 60 * 60 * 24 }));
        }
    };

    const handleProductionCompleted = async (event) => {
        const { tenantId, data } = event;
        const { productionOrderId, actualQuantity, productId, rawMaterials } = data;

        console.log(`[ManufacturingProcessManager] Production Completed for ${productionOrderId}. Updating Inventory.`);

        if (rawMaterials && rawMaterials.length > 0) {
            for (const mat of rawMaterials) {
                await inventoryCommandBus.execute({
                    type: ReserveStock,
                    aggregateId: mat.productId,
                    tenantId,
                    payload: {
                        orderId: productionOrderId, // Use ProdOrderID as ref
                        quantity: mat.quantity,
                        allowPartial: false
                    }
                });
            }
        }

        await inventoryCommandBus.execute({
            type: ReceiveStock,
            aggregateId: productId,
            tenantId,
            payload: {
                locationId: 'FG-001', // Finished Goods location
                batchId: productionOrderId, // Use ProdOrder as Batch
                quantity: actualQuantity,
                reason: `Production ${productionOrderId}`
            }
        });
    };

    return { handle };
};
