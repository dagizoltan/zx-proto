import { createBatch } from '../entities/warehouse.js';

export const createInventoryAdjustmentService = (stockRepository, stockMovementRepository, batchRepository) => {

    const receiveStock = async (tenantId, { productId, locationId, quantity, batchId, batchData, reason, userId }) => {
        let finalBatchId = batchId;

        // Handle Batch Creation
        if (!finalBatchId && batchData && batchRepository) {
            // Check if batch exists by sku + batchNumber
            if (batchData.batchNumber) {
                // Ideally repo has findByNumber, but for now we assume create new
                // Simplified: Create new batch
                const batch = createBatch({
                    id: crypto.randomUUID(),
                    tenantId,
                    sku: batchData.sku || 'UNKNOWN', // Should verify SKU from product
                    batchNumber: batchData.batchNumber,
                    expiryDate: batchData.expiryDate,
                    receivedAt: new Date().toISOString()
                });
                await batchRepository.save(tenantId, batch);
                finalBatchId = batch.id;
            }
        }

        // Use 'default' if no batch specified
        if (!finalBatchId) finalBatchId = 'default';

        let entry = await stockRepository.getEntryByBatch(tenantId, productId, locationId, finalBatchId);

        if (!entry) {
            entry = {
                id: crypto.randomUUID(),
                tenantId,
                productId,
                locationId,
                quantity: 0,
                reservedQuantity: 0,
                batchId: finalBatchId
            };
        }

        const updated = {
            ...entry,
            quantity: entry.quantity + quantity,
            updatedAt: new Date().toISOString()
        };

        await stockRepository.save(tenantId, updated);

        await stockMovementRepository.save(tenantId, {
            id: crypto.randomUUID(),
            tenantId,
            productId,
            quantity,
            type: 'received',
            fromLocationId: null,
            toLocationId: locationId,
            batchId: finalBatchId,
            reason,
            userId,
            timestamp: new Date().toISOString()
        });

        return updated;
    };

    const adjustStock = async (tenantId, { productId, locationId, newQuantity, reason, userId, batchId }) => {
        // Adjustment should ideally specify batch. If not, we might be in trouble.
        // For now, default to 'default' or we could try to find ANY entry at location.
        // Let's assume 'default' if missing for legacy compatibility, but this is weak.

        const targetBatchId = batchId || 'default';
        const entry = await stockRepository.getEntryByBatch(tenantId, productId, locationId, targetBatchId);

        if (!entry) throw new Error('Stock entry not found for adjustment');

        const diff = newQuantity - entry.quantity;

        const updated = {
            ...entry,
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
        };

        await stockRepository.save(tenantId, updated);

        await stockMovementRepository.save(tenantId, {
            id: crypto.randomUUID(),
            tenantId,
            productId,
            quantity: Math.abs(diff),
            type: 'adjusted',
            fromLocationId: locationId,
            batchId: targetBatchId,
            referenceId: reason,
            userId,
            timestamp: new Date().toISOString()
        });

        return updated;
    };

    return { receiveStock, adjustStock };
};
