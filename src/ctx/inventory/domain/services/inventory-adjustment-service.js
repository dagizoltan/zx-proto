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

        // Find existing entry or create new
        // Note: Stock Entry should be unique by Product + Location + Batch?
        // If we track batches, we need separate entries for each batch in each location?
        // Or we mix them? Enterprise usually separates them.
        // For now, I'll stick to Product+Location uniqueness but this is a limitation.
        // TO DO: Update StockRepository to support Batch granularity.

        let entry = await stockRepository.getEntry(tenantId, productId, locationId);

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
        } else {
             // If entry exists, we might be mixing batches?
             // If entry.batchId !== finalBatchId, we have a problem if we want strict separation.
             // For this iteration, assuming single batch per location or mixed.
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

    const adjustStock = async (tenantId, { productId, locationId, newQuantity, reason, userId }) => {
        const entry = await stockRepository.getEntry(tenantId, productId, locationId);
        if (!entry) throw new Error('Stock entry not found');

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
            fromLocationId: locationId, // Contextual
            referenceId: reason,
            userId,
            timestamp: new Date().toISOString()
        });

        return updated;
    };

    return { receiveStock, adjustStock };
};
