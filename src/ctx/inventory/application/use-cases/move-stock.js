export const createMoveStock = ({ stockRepository, stockMovementRepository }) => {
    const execute = async (tenantId, { productId, fromLocationId, toLocationId, quantity, userId, date }) => {
        const now = date || new Date().toISOString();
        const fromEntry = await stockRepository.getEntry(tenantId, productId, fromLocationId);
        if (!fromEntry || (fromEntry.quantity - fromEntry.reservedQuantity) < quantity) {
            throw new Error('Insufficient stock at source location');
        }

        let toEntry = await stockRepository.getEntry(tenantId, productId, toLocationId);
        if (!toEntry) {
            toEntry = {
                id: crypto.randomUUID(),
                tenantId,
                productId,
                locationId: toLocationId,
                quantity: 0,
                reservedQuantity: 0,
            };
        }

        // Atomic transaction ideally
        await stockRepository.save(tenantId, {
            ...fromEntry,
            quantity: fromEntry.quantity - quantity,
            updatedAt: now
        });

        await stockRepository.save(tenantId, {
            ...toEntry,
            quantity: toEntry.quantity + quantity,
            updatedAt: now
        });

        await stockMovementRepository.save(tenantId, {
            id: crypto.randomUUID(),
            tenantId,
            productId,
            quantity,
            type: 'moved',
            fromLocationId,
            toLocationId,
            userId,
            timestamp: now
        });

        return true;
    };
    return { execute };
};
