// Service to handle complex allocation logic
export const createStockAllocationService = (stockRepository, stockMovementRepository, batchRepository) => {

  const allocate = async (tenantId, productId, amount, referenceId) => {
    // 1. Get all stock entries for product
    const entries = await stockRepository.getEntriesForProduct(tenantId, productId);

    // 2. Filter available entries
    const availableEntries = entries.filter(e => (e.quantity - e.reservedQuantity) > 0);

    if (availableEntries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0) < amount) {
        throw new Error(`Insufficient stock for product ${productId}`);
    }

    // 3. Enhance with Batch Info for sorting
    // We need to fetch batches to get expiry dates
    const enrichedEntries = await Promise.all(availableEntries.map(async (entry) => {
        let batch = null;
        if (entry.batchId && entry.batchId !== 'default' && batchRepository) {
            batch = await batchRepository.findById(tenantId, entry.batchId);
        }
        return { ...entry, batch };
    }));

    // 4. Sort Strategy: FEFO (First Expired First Out) -> FIFO (First In First Out)
    enrichedEntries.sort((a, b) => {
        // FEFO
        const expiryA = a.batch?.expiryDate ? new Date(a.batch.expiryDate).getTime() : Infinity; // No expiry = last
        const expiryB = b.batch?.expiryDate ? new Date(b.batch.expiryDate).getTime() : Infinity;

        if (expiryA !== expiryB) {
            return expiryA - expiryB;
        }

        // FIFO (using batch receivedAt or entry createdAt/updatedAt?)
        // Batch receivedAt is best.
        const receivedA = a.batch?.receivedAt ? new Date(a.batch.receivedAt).getTime() : 0;
        const receivedB = b.batch?.receivedAt ? new Date(b.batch.receivedAt).getTime() : 0;

        // If no batch info, fallback to entry creation? We don't have created_at on entry easily accessible here (only updated).
        // Let's assume 0 if unknown, or maybe we should prioritize 'default' last?
        // Let's just standard sort.
        return receivedA - receivedB;
    });

    let remaining = amount;

    for (const entry of enrichedEntries) {
        if (remaining <= 0) break;

        const available = entry.quantity - entry.reservedQuantity;
        const take = Math.min(available, remaining);

        const updated = {
            ...entry,
            reservedQuantity: entry.reservedQuantity + take,
            updatedAt: new Date().toISOString()
        };
        // entry has .batch property attached now, but save() expects clean object?
        // No, we destructured/mapped. 'entry' inside 'enrichedEntries' has 'batch'.
        // We should strip 'batch' before saving or ensure 'save' handles it.
        // kv-stock-repository just saves what it gets. Ideally we sanitize.
        const { batch, ...cleanEntry } = updated;

        await stockRepository.save(tenantId, cleanEntry);

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
            batchId: entry.batchId, // CRITICAL: Save batchId
            timestamp: new Date().toISOString()
        });

        remaining -= take;
    }
  };

  const commit = async (tenantId, referenceId) => {
    const movements = await stockMovementRepository.getByReference(tenantId, referenceId);
    const allocated = movements.filter(m => m.type === 'allocated');

    for (const alloc of allocated) {
        // Find the specific stock entry using batchId
        const batchId = alloc.batchId || 'default';
        const entry = await stockRepository.getEntryByBatch(tenantId, alloc.productId, alloc.fromLocationId, batchId);

        if (!entry) {
            console.error(`Stock entry missing during commit for ${alloc.productId} at ${alloc.fromLocationId} batch ${batchId}`);
            continue;
        }

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
            batchId: alloc.batchId,
            timestamp: new Date().toISOString()
        });
    }
  };

  const release = async (tenantId, referenceId) => {
    const movements = await stockMovementRepository.getByReference(tenantId, referenceId);
    const allocated = movements.filter(m => m.type === 'allocated');

    for (const alloc of allocated) {
        const batchId = alloc.batchId || 'default';
        const entry = await stockRepository.getEntryByBatch(tenantId, alloc.productId, alloc.fromLocationId, batchId);

        if (!entry) continue;

        // Release: Reduce ReservedQuantity only.
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
            batchId: alloc.batchId,
            timestamp: new Date().toISOString()
        });
    }
  };

  return { allocate, commit, release };
};
