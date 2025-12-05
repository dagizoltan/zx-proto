// Service to handle complex allocation logic
export const createStockAllocationService = (stockRepository, stockMovementRepository, batchRepository, productRepository) => {

  const _updateProductTotal = async (tenantId, productId) => {
    if (!productRepository) return;
    const entries = await stockRepository.getEntriesForProduct(tenantId, productId);
    const total = entries.reduce((sum, e) => sum + e.quantity, 0);
    const product = await productRepository.findById(tenantId, productId);
    if (product) {
        await productRepository.save(tenantId, { ...product, quantity: total });
    }
  };

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

        // FIFO
        const receivedA = a.batch?.receivedAt ? new Date(a.batch.receivedAt).getTime() : 0;
        const receivedB = b.batch?.receivedAt ? new Date(b.batch.receivedAt).getTime() : 0;
        return receivedA - receivedB;
    });

    let remaining = amount;

    // Use a simpler approach for now: Serial reservation updates
    // In a real high-concurrency scenario, this should be an atomic transaction block.
    // For MVP, we at least ensure check happened.

    for (const entry of enrichedEntries) {
        if (remaining <= 0) break;

        // Re-check logic here is hard without transaction, assuming Optimistic Locking or Single Threaded Deno (mostly)
        // Deno is single threaded JS, so no preemptive race condition within synchronous blocks,
        // BUT async await yields. So between "getEntries" and "save", another request could intervene.
        // We'll trust the caller to handle higher level locking or accept the risk for MVP.

        const available = entry.quantity - entry.reservedQuantity;
        const take = Math.min(available, remaining);

        const updated = {
            ...entry,
            reservedQuantity: entry.reservedQuantity + take,
            updatedAt: new Date().toISOString()
        };
        const { batch, ...cleanEntry } = updated;

        await stockRepository.save(tenantId, cleanEntry);
        // Note: allocations do not change total quantity, only reserved. So no need to updateProductTotal.

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
            batchId: entry.batchId,
            timestamp: new Date().toISOString()
        });

        remaining -= take;
    }
  };

  // NEW: Bulk allocation wrapper to reduce race conditions
  const allocateBatch = async (tenantId, items, referenceId) => {
    // Items: [{ productId, quantity }]
    // Phase 1: Check ALL availability first (Read Phase)
    for (const item of items) {
        const entries = await stockRepository.getEntriesForProduct(tenantId, item.productId);
        const available = entries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0);
        if (available < item.quantity) {
             throw new Error(`Insufficient stock for product ${item.productId}. Required: ${item.quantity}, Available: ${available}`);
        }
    }

    // Phase 2: Reserve (Write Phase)
    // We execute reserves sequentially. If one fails (rare after check), we are in trouble (partial order).
    // Ideal: Rollback mechanism.
    // MVP: Proceed. The window for race condition is now minimized to the time between Phase 1 and Phase 2.

    for (const item of items) {
        await allocate(tenantId, item.productId, item.quantity, referenceId);
    }
  };

  const commit = async (tenantId, referenceId, itemsToShip = null) => {
    // itemsToShip: Array of { productId, quantity } or null (all)
    const movements = await stockMovementRepository.getByReference(tenantId, referenceId);

    // 1. Calculate Open Allocations (Allocated - Released - Shipped) per Key (Prod+Loc+Batch)
    // We use a key to aggregate quantities because multiple movements might exist
    const getKey = (m) => `${m.productId}:${m.fromLocationId}:${m.batchId || 'default'}`;

    const inventoryMap = new Map(); // Key -> { allocated: 0, shipped: 0, released: 0, meta: { prod, loc, batch } }

    for (const m of movements) {
        const key = getKey(m);
        if (!inventoryMap.has(key)) {
            inventoryMap.set(key, {
                allocated: 0, shipped: 0, released: 0,
                meta: { productId: m.productId, fromLocationId: m.fromLocationId, batchId: m.batchId }
            });
        }
        const rec = inventoryMap.get(key);
        if (m.type === 'allocated') rec.allocated += m.quantity;
        if (m.type === 'shipped') rec.shipped += m.quantity;
        if (m.type === 'released') rec.released += m.quantity;
    }

    // 2. Determine what to ship
    const toShip = []; // List of { key, quantity }
    const affectedProducts = new Set();

    if (!itemsToShip) {
        // Ship ALL remaining
        for (const [key, rec] of inventoryMap.entries()) {
            const remaining = rec.allocated - rec.released - rec.shipped;
            if (remaining > 0) {
                toShip.push({ key, quantity: remaining, ...rec.meta });
            }
        }
    } else {
        // Ship specific items
        // We need to match requested Qty to available allocations
        // Strategy: Iterate requested items, find matching keys, consume until satisfied

        for (const req of itemsToShip) {
            let needed = req.quantity;

            // Find keys for this product
            const candidateKeys = Array.from(inventoryMap.entries())
                .filter(([k, v]) => v.meta.productId === req.productId)
                .map(([k, v]) => ({ key: k, rec: v, remaining: v.allocated - v.released - v.shipped }));

            // Sort candidates? FIFO? (Assuming insertion order or just pick first available)
            // Ideally should match specific batch if requested, but shipment usually just says "SKU X, Qty 5"

            for (const cand of candidateKeys) {
                if (needed <= 0) break;
                if (cand.remaining <= 0) continue;

                const take = Math.min(needed, cand.remaining);
                toShip.push({ key: cand.key, quantity: take, ...cand.rec.meta });

                needed -= take;
            }

            if (needed > 0) {
                 // Warning or Error?
                 // For now, we ship what we can.
                 console.warn(`Could not find full allocation for product ${req.productId}, missing ${needed}`);
            }
        }
    }

    // 3. Execute Shipments
    for (const action of toShip) {
        const { productId, fromLocationId, batchId, quantity } = action;
        const normalizedBatchId = batchId || 'default';

        const entry = await stockRepository.getEntryByBatch(tenantId, productId, fromLocationId, normalizedBatchId);

        if (!entry) {
            console.error(`Stock entry missing during commit for ${productId} at ${fromLocationId} batch ${normalizedBatchId}`);
            continue;
        }

        const updated = {
            ...entry,
            quantity: entry.quantity - quantity,
            reservedQuantity: entry.reservedQuantity - quantity,
            updatedAt: new Date().toISOString()
        };

        await stockRepository.save(tenantId, updated);
        affectedProducts.add(productId);

        // Record 'shipped' movement
        await stockMovementRepository.save(tenantId, {
            id: crypto.randomUUID(),
            tenantId,
            productId,
            quantity,
            type: 'shipped',
            fromLocationId,
            referenceId,
            batchId: normalizedBatchId,
            timestamp: new Date().toISOString()
        });
    }

    // Update product totals
    for (const pid of affectedProducts) {
        await _updateProductTotal(tenantId, pid);
    }
  };

  const release = async (tenantId, referenceId) => {
    // Release ALL remaining allocations (cancel remainder)
    // Similar logic to commit, calculate remaining allocated and release it
    const movements = await stockMovementRepository.getByReference(tenantId, referenceId);

    const getKey = (m) => `${m.productId}:${m.fromLocationId}:${m.batchId || 'default'}`;
    const inventoryMap = new Map();

    for (const m of movements) {
        const key = getKey(m);
        if (!inventoryMap.has(key)) {
            inventoryMap.set(key, {
                allocated: 0, shipped: 0, released: 0,
                meta: { productId: m.productId, fromLocationId: m.fromLocationId, batchId: m.batchId }
            });
        }
        const rec = inventoryMap.get(key);
        if (m.type === 'allocated') rec.allocated += m.quantity;
        if (m.type === 'shipped') rec.shipped += m.quantity;
        if (m.type === 'released') rec.released += m.quantity;
    }

    for (const [key, rec] of inventoryMap.entries()) {
        const remaining = rec.allocated - rec.released - rec.shipped;
        if (remaining > 0) {
            const { productId, fromLocationId, batchId } = rec.meta;
            const normalizedBatchId = batchId || 'default';

            const entry = await stockRepository.getEntryByBatch(tenantId, productId, fromLocationId, normalizedBatchId);
            if (!entry) continue;

            const updated = {
                ...entry,
                reservedQuantity: entry.reservedQuantity - remaining,
                updatedAt: new Date().toISOString()
            };

            await stockRepository.save(tenantId, updated);
            // Release does not change total stock, only reserved. No need to updateProductTotal.

            await stockMovementRepository.save(tenantId, {
                id: crypto.randomUUID(),
                tenantId,
                productId,
                quantity: remaining,
                type: 'released',
                fromLocationId,
                referenceId,
                batchId: normalizedBatchId,
                timestamp: new Date().toISOString()
            });
        }
    }
  };

  return { allocate, commit, release, allocateBatch };
};
