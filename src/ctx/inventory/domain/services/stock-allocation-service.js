// Service to handle complex allocation logic
export const createStockAllocationService = (stockRepository, stockMovementRepository) => {

  const allocate = async (tenantId, productId, amount, referenceId) => {
    // 1. Get all stock entries for product
    const entries = await stockRepository.getEntriesForProduct(tenantId, productId);

    // 2. Sort by simple strategy (e.g. prioritize larger batches or FIFO if we had dates)
    // For now, just pick first available
    const availableEntries = entries.filter(e => (e.quantity - e.reservedQuantity) > 0);

    let remaining = amount;

    if (availableEntries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0) < amount) {
        throw new Error(`Insufficient stock for product ${productId}`);
    }

    for (const entry of availableEntries) {
        if (remaining <= 0) break;

        const available = entry.quantity - entry.reservedQuantity;
        const take = Math.min(available, remaining);

        const updated = {
            ...entry,
            reservedQuantity: entry.reservedQuantity + take,
            updatedAt: new Date().toISOString()
        };

        await stockRepository.save(tenantId, updated);

        // Record movement (soft allocation)
        await stockMovementRepository.save(tenantId, {
            id: crypto.randomUUID(),
            tenantId,
            productId,
            quantity: take,
            type: 'allocated',
            fromLocationId: entry.locationId,
            toLocationId: null, // Not moving yet, just allocated
            referenceId,
            timestamp: new Date().toISOString()
        });

        remaining -= take;
    }
  };

  return { allocate };
};
