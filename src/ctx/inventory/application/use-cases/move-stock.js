import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createMoveStock = ({ stockRepository, stockMovementRepository }) => {
    const execute = async (tenantId, { productId, fromLocationId, toLocationId, quantity, userId }) => {
        if (fromLocationId === toLocationId) return Err({ code: 'VALIDATION_ERROR', message: 'Source and destination locations must be different' });
        if (quantity <= 0) return Err({ code: 'VALIDATION_ERROR', message: 'Quantity must be positive' });

        const batchId = 'default';

        const fromRes = await stockRepository.findEntry(tenantId, productId, fromLocationId, batchId);
        if (isErr(fromRes)) return fromRes;
        const fromEntry = fromRes.value;

        const available = fromEntry ? (fromEntry.quantity - fromEntry.reservedQuantity) : 0;

        if (!fromEntry || available < quantity) {
            return Err({ code: 'INSUFFICIENT_STOCK', message: `Insufficient stock at source location. Available: ${available}, Required: ${quantity}` });
        }

        const toRes = await stockRepository.findEntry(tenantId, productId, toLocationId, batchId);
        if (isErr(toRes)) return toRes;
        let toEntry = toRes.value;

        if (!toEntry) {
            toEntry = {
                id: crypto.randomUUID(),
                tenantId,
                productId,
                locationId: toLocationId,
                quantity: 0,
                reservedQuantity: 0,
                batchId: batchId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }

        const saveFromRes = await stockRepository.save(tenantId, {
            ...fromEntry,
            quantity: fromEntry.quantity - quantity,
            updatedAt: new Date().toISOString()
        });
        if (isErr(saveFromRes)) return saveFromRes;

        const saveToRes = await stockRepository.save(tenantId, {
            ...toEntry,
            quantity: toEntry.quantity + quantity,
            updatedAt: new Date().toISOString()
        });
        if (isErr(saveToRes)) return saveToRes;

        const movRes = await stockMovementRepository.save(tenantId, {
            id: crypto.randomUUID(),
            tenantId,
            productId,
            quantity,
            type: 'moved',
            fromLocationId,
            toLocationId,
            batchId,
            userId,
            timestamp: new Date().toISOString(),
            referenceId: `TRANSFER-${Date.now()}`
        });
        if (isErr(movRes)) return movRes;

        return Ok(true);
    };
    return { execute };
};
