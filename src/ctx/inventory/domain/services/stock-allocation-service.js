// Service to handle complex allocation logic
export const createStockAllocationService = (stockRepository, stockMovementRepository) => {

  const allocate = async (tenantId, productId, amount, referenceId) => {
    // 1. Get all stock entries for product
    const entries = await stockRepository.getEntriesForProduct(tenantId, productId);

    // 2. Sort by simple strategy (e.g. prioritize larger batches or FIFO if we had dates)
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
            toLocationId: null,
            referenceId,
            timestamp: new Date().toISOString()
        });

        remaining -= take;
    }
  };

  const commit = async (tenantId, referenceId) => {
    // Find all 'allocated' movements for this reference
    const movements = await stockMovementRepository.getByReference(tenantId, referenceId);
    const allocated = movements.filter(m => m.type === 'allocated');

    for (const alloc of allocated) {
        // Find the specific stock entry (we need to infer it or store it better,
        // but currently we stored 'fromLocationId' in the movement which helps)

        // Note: In a robust system we'd link movement -> stockEntryID specifically.
        // Here we rely on productId + locationId.
        const entry = await stockRepository.getEntry(tenantId, alloc.productId, alloc.fromLocationId);

        if (!entry) {
            console.error(`Stock entry missing during commit for ${alloc.productId} at ${alloc.fromLocationId}`);
            continue;
        }

        // Commit: Reduce Quantity AND ReservedQuantity
        // e.g. Qty: 10, Rsrv: 2 -> Commit 2 -> Qty: 8, Rsrv: 0
        const updated = {
            ...entry,
            quantity: entry.quantity - alloc.quantity,
            reservedQuantity: entry.reservedQuantity - alloc.quantity,
            updatedAt: new Date().toISOString()
        };

        await stockRepository.save(tenantId, updated);

        // Record 'shipped' movement
        await stockMovementRepository.save(tenantId, {
            id: crypto.randomUUID(),
            tenantId,
            productId: alloc.productId,
            quantity: alloc.quantity,
            type: 'shipped',
            fromLocationId: alloc.fromLocationId,
            referenceId,
            timestamp: new Date().toISOString()
        });
    }
  };

  const release = async (tenantId, referenceId) => {
    const movements = await stockMovementRepository.getByReference(tenantId, referenceId);
    const allocated = movements.filter(m => m.type === 'allocated');

    for (const alloc of allocated) {
        const entry = await stockRepository.getEntry(tenantId, alloc.productId, alloc.fromLocationId);
        if (!entry) continue;

        // Release: Reduce ReservedQuantity only. Quantity stays same (items go back to shelf).
        const updated = {
            ...entry,
            reservedQuantity: entry.reservedQuantity - alloc.quantity,
            updatedAt: new Date().toISOString()
        };

        await stockRepository.save(tenantId, updated);

        // Record 'released' movement
        await stockMovementRepository.save(tenantId, {
            id: crypto.randomUUID(),
            tenantId,
            productId: alloc.productId,
            quantity: alloc.quantity,
            type: 'released',
            fromLocationId: alloc.fromLocationId,
            referenceId,
            timestamp: new Date().toISOString()
        });
    }
  };

  return { allocate, commit, release };
};
