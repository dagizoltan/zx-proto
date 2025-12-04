export const createInventoryAdjustmentService = (stockRepository, stockMovementRepository) => {

    const receiveStock = async (tenantId, { productId, locationId, quantity, batchId, reason, userId }) => {
        // Find existing entry or create new
        let entry = await stockRepository.getEntry(tenantId, productId, locationId);

        if (!entry) {
            entry = {
                id: crypto.randomUUID(),
                tenantId,
                productId,
                locationId,
                quantity: 0,
                reservedQuantity: 0,
                batchId
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
            batchId,
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
