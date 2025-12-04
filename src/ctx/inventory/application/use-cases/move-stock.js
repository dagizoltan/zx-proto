export const createMoveStock = ({ stockRepository, stockMovementRepository }) => {
    const execute = async (tenantId, { productId, fromLocationId, toLocationId, quantity, userId }) => {
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
            updatedAt: new Date().toISOString()
        });

        await stockRepository.save(tenantId, {
            ...toEntry,
            quantity: toEntry.quantity + quantity,
            updatedAt: new Date().toISOString()
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
            timestamp: new Date().toISOString()
        });

        return true;
    };
    return { execute };
};
