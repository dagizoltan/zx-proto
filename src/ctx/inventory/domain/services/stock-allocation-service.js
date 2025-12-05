// Service to handle complex allocation logic
export const createStockAllocationService = (stockRepository, stockMovementRepository, batchRepository, productRepository) => {

  // Deprecated: Inefficient total calculation.
  // We keep it for legacy calls but rely on delta updates for atomic paths if possible.
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
    await allocateBatch(tenantId, [{ productId, quantity: amount }], referenceId);
  };

  // NEW: Atomic Retry Loop Strategy
  const allocateBatch = async (tenantId, items, referenceId) => {
    const MAX_RETRIES = 5;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        attempt++;
        try {
            // 1. Read All State
            const productIds = [...new Set(items.map(i => i.productId))];
            const stockMap = new Map(); // productId -> [{ value, versionstamp, key }]

            // Fetch in parallel
            await Promise.all(productIds.map(async (pid) => {
                const entries = await stockRepository.getEntriesWithVersion(tenantId, pid);
                stockMap.set(pid, entries);
            }));

            // 2. Plan Allocations
            const updates = []; // { key, versionstamp, value }
            const movements = []; // { ...movement }

            for (const req of items) {
                const entries = stockMap.get(req.productId) || [];

                // Enhance with batch info (in-memory only, assumes batch metadata rarely changes or isn't critical for lock)
                // For strict correctness, we should have versionstamps for batch metadata too, but ignoring for MVP.
                const enriched = await Promise.all(entries.map(async (e) => {
                    let batch = null;
                    if (e.value.batchId && e.value.batchId !== 'default' && batchRepository) {
                        batch = await batchRepository.findById(tenantId, e.value.batchId);
                    }
                    return { ...e, batch };
                }));

                // Sort FEFO -> FIFO
                enriched.sort((a, b) => {
                    const expiryA = a.batch?.expiryDate ? new Date(a.batch.expiryDate).getTime() : Infinity;
                    const expiryB = b.batch?.expiryDate ? new Date(b.batch.expiryDate).getTime() : Infinity;
                    if (expiryA !== expiryB) return expiryA - expiryB;

                    const receivedA = a.batch?.receivedAt ? new Date(a.batch.receivedAt).getTime() : 0;
                    const receivedB = b.batch?.receivedAt ? new Date(b.batch.receivedAt).getTime() : 0;
                    return receivedA - receivedB;
                });

                // Distribute
                let remaining = req.quantity;
                let availableTotal = enriched.reduce((sum, e) => sum + (e.value.quantity - e.value.reservedQuantity), 0);

                if (availableTotal < remaining) {
                    throw new Error(`Insufficient stock for product ${req.productId}. Required: ${req.quantity}, Available: ${availableTotal}`);
                }

                for (const entry of enriched) {
                    if (remaining <= 0) break;

                    const available = entry.value.quantity - entry.value.reservedQuantity;
                    if (available <= 0) continue;

                    const take = Math.min(available, remaining);

                    const newValue = {
                        ...entry.value,
                        reservedQuantity: entry.value.reservedQuantity + take,
                        updatedAt: new Date().toISOString()
                    };

                    updates.push({
                        key: entry.key,
                        versionstamp: entry.versionstamp,
                        value: newValue
                    });

                    movements.push({
                        id: crypto.randomUUID(),
                        tenantId,
                        productId: req.productId,
                        quantity: take,
                        type: 'allocated',
                        fromLocationId: entry.value.locationId,
                        toLocationId: null,
                        referenceId,
                        batchId: entry.value.batchId,
                        timestamp: new Date().toISOString()
                    });

                    remaining -= take;
                }
            }

            // 3. Commit
            if (updates.length > 0) {
                const success = await stockRepository.commitUpdates(tenantId, updates);
                if (!success) {
                    // Optimistic Lock Failed (someone else changed stock)
                    // Retry loop will catch this
                    if (attempt === MAX_RETRIES) throw new Error('Failed to allocate stock after multiple attempts (High Concurrency)');
                    await new Promise(r => setTimeout(r, Math.random() * 50)); // Jitter
                    continue;
                }
            }

            // 4. Post-Commit Actions (Movements)
            // Ideally these should be in the same atomic transaction, but Deno KV has limits (10 ops, 64k size).
            // Movements are log-only. If they fail, stock is reserved but log is missing.
            // We can accept this risk for MVP or use a secondary queue.
            // For now, simple save.
            await Promise.all(movements.map(m => stockMovementRepository.save(tenantId, m)));

            return; // Success

        } catch (e) {
            // Rethrow non-concurrency errors immediately
            if (e.message.includes('Insufficient stock')) throw e;
            if (attempt === MAX_RETRIES) throw e;
            // Otherwise retry
        }
    }
  };

  const commit = async (tenantId, referenceId, itemsToShip = null) => {
    // Commit converts Reserved -> Shipped (Reduction of Total)

    // We need to fetch movements to know WHAT was reserved.
    const movements = await stockMovementRepository.getByReference(tenantId, referenceId);

    // Aggregate Reservations
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

    // Determine what to ship
    const toShip = []; // { key, quantity, ...meta }
    const affectedProducts = new Set();

    if (!itemsToShip) {
        // Ship ALL remaining
        for (const [key, rec] of inventoryMap.entries()) {
            const remaining = rec.allocated - rec.released - rec.shipped;
            if (remaining > 0) {
                toShip.push({ keyStr: key, quantity: remaining, ...rec.meta });
            }
        }
    } else {
        // Ship specific items
        for (const req of itemsToShip) {
            let needed = req.quantity;
            const candidateKeys = Array.from(inventoryMap.entries())
                .filter(([k, v]) => v.meta.productId === req.productId)
                .map(([k, v]) => ({ keyStr: k, rec: v, remaining: v.allocated - v.released - v.shipped }));

            for (const cand of candidateKeys) {
                if (needed <= 0) break;
                if (cand.remaining <= 0) continue;
                const take = Math.min(needed, cand.remaining);
                toShip.push({ keyStr: cand.keyStr, quantity: take, ...cand.rec.meta });
                needed -= take;
            }
        }
    }

    // execute atomic updates
    // We must read versions first to be safe (Optimistic Locking)
    // Group by productId for efficiency? Or just loop.
    // For simplicity, we loop robustly (similar to allocateBatch)

    // Since 'commit' is deduction, we can reuse logic or write a simplified loop.
    // We'll iterate the 'toShip' list and attempt atomic updates.

    const updates = [];
    const newMovements = [];

    // Pre-fetch versions
    const productIds = [...new Set(toShip.map(x => x.productId))];
    const stockMap = new Map();
    await Promise.all(productIds.map(async (pid) => {
        const entries = await stockRepository.getEntriesWithVersion(tenantId, pid);
        stockMap.set(pid, entries);
    }));

    for (const action of toShip) {
        const { productId, fromLocationId, batchId, quantity } = action;
        const normalizedBatchId = batchId || 'default';

        const entries = stockMap.get(productId);
        const entry = entries.find(e => e.value.locationId === fromLocationId && e.value.batchId === normalizedBatchId);

        if (!entry) {
             console.error(`Stock entry missing/concurrently deleted during commit: ${productId} @ ${fromLocationId}`);
             continue;
        }

        const newValue = {
            ...entry.value,
            quantity: entry.value.quantity - quantity, // Deduct from Total
            reservedQuantity: entry.value.reservedQuantity - quantity, // Deduct from Reserved
            updatedAt: new Date().toISOString()
        };

        updates.push({
            key: entry.key,
            versionstamp: entry.versionstamp,
            value: newValue
        });

        affectedProducts.add(productId);

        newMovements.push({
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

    if (updates.length > 0) {
        // Commit updates
        const success = await stockRepository.commitUpdates(tenantId, updates);
        if (!success) {
            throw new Error('Commit failed due to concurrent modification. Please retry.');
        }

        // Save Movements
        await Promise.all(newMovements.map(m => stockMovementRepository.save(tenantId, m)));

        // Update Product Totals
        for (const pid of affectedProducts) {
             await _updateProductTotal(tenantId, pid);
        }
    }
  };

  const release = async (tenantId, referenceId) => {
    // Release ALL remaining allocations (cancel remainder)
    // Refactored to be Atomic (Robust) with Retry Loop

    const MAX_RETRIES = 5;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        attempt++;
        try {
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

            const updates = [];
            const newMovements = [];
            const productIdsToScan = new Set();
            const actions = [];

            for (const [key, rec] of inventoryMap.entries()) {
                const remaining = rec.allocated - rec.released - rec.shipped;
                if (remaining > 0) {
                    productIdsToScan.add(rec.meta.productId);
                    actions.push({ ...rec.meta, quantity: remaining });
                }
            }

            if (actions.length === 0) return; // Nothing to release

            // Pre-fetch versions
            const stockMap = new Map();
            await Promise.all(Array.from(productIdsToScan).map(async (pid) => {
                const entries = await stockRepository.getEntriesWithVersion(tenantId, pid);
                stockMap.set(pid, entries);
            }));

            for (const action of actions) {
                const { productId, fromLocationId, batchId, quantity } = action;
                const normalizedBatchId = batchId || 'default';
                const entries = stockMap.get(productId);
                const entry = entries.find(e => e.value.locationId === fromLocationId && e.value.batchId === normalizedBatchId);

                if (!entry) continue; // Can't release what's gone

                const newValue = {
                    ...entry.value,
                    reservedQuantity: entry.value.reservedQuantity - quantity,
                    updatedAt: new Date().toISOString()
                };

                updates.push({
                    key: entry.key,
                    versionstamp: entry.versionstamp,
                    value: newValue
                });

                newMovements.push({
                    id: crypto.randomUUID(),
                    tenantId,
                    productId,
                    quantity,
                    type: 'released',
                    fromLocationId,
                    referenceId,
                    batchId: normalizedBatchId,
                    timestamp: new Date().toISOString()
                });
            }

            if (updates.length > 0) {
                const success = await stockRepository.commitUpdates(tenantId, updates);
                if (!success) {
                    await new Promise(r => setTimeout(r, Math.random() * 50));
                    continue; // Retry
                }
                await Promise.all(newMovements.map(m => stockMovementRepository.save(tenantId, m)));
            }
            return; // Success

        } catch (e) {
            if (attempt === MAX_RETRIES) throw e;
        }
    }
  };

  // NEW: Atomic Production (Consume Raw + Produce Finished)
  const executeProduction = async (tenantId, { consume, produce, reason, userId }) => {
     // consume: [{ productId, quantity, locationId }]
     // produce: { productId, quantity, locationId, batchId } (Single item for now)

     const MAX_RETRIES = 5;
     let attempt = 0;

     while (attempt < MAX_RETRIES) {
         attempt++;
         try {
             // 1. Gather all Read Keys
             const consumePids = consume.map(c => c.productId);
             const producePid = produce.productId;
             const allPids = [...new Set([...consumePids, producePid])];

             const stockMap = new Map();
             await Promise.all(allPids.map(async (pid) => {
                 const entries = await stockRepository.getEntriesWithVersion(tenantId, pid);
                 stockMap.set(pid, entries);
             }));

             const updates = [];
             const movements = [];
             const affectedProducts = new Set();

             // 2. Process Consumption (Deduction)
             for (const item of consume) {
                 const entries = stockMap.get(item.productId);
                 const locationEntries = entries.filter(e => e.value.locationId === item.locationId);

                 let remaining = item.quantity;
                 let availableTotal = locationEntries.reduce((sum, e) => sum + e.value.quantity, 0);

                 if (availableTotal < remaining) {
                     throw new Error(`Insufficient stock for component ${item.productId} at ${item.locationId}`);
                 }

                 for (const entry of locationEntries) {
                     if (remaining <= 0) break;
                     if (entry.value.quantity <= 0) continue;

                     const take = Math.min(entry.value.quantity, remaining);
                     const newValue = {
                         ...entry.value,
                         quantity: entry.value.quantity - take,
                         updatedAt: new Date().toISOString()
                     };

                     updates.push({
                         key: entry.key,
                         versionstamp: entry.versionstamp,
                         value: newValue
                     });

                     movements.push({
                         id: crypto.randomUUID(),
                         tenantId,
                         productId: item.productId,
                         quantity: take,
                         type: 'consumed',
                         fromLocationId: item.locationId,
                         batchId: entry.value.batchId || 'default',
                         referenceId: reason,
                         timestamp: new Date().toISOString()
                     });

                     affectedProducts.add(item.productId);

                     remaining -= take;
                 }
             }

             // 3. Process Production (Addition)
             const produceEntries = stockMap.get(producePid);
             const targetBatch = produce.batchId || `BATCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;

             const existingEntry = produceEntries.find(e =>
                 e.value.locationId === produce.locationId &&
                 (e.value.batchId === targetBatch || (!e.value.batchId && targetBatch === 'default'))
             );

             if (existingEntry) {
                 updates.push({
                     key: existingEntry.key,
                     versionstamp: existingEntry.versionstamp,
                     value: {
                         ...existingEntry.value,
                         quantity: existingEntry.value.quantity + produce.quantity,
                         updatedAt: new Date().toISOString()
                     }
                 });
             } else {
                 const newEntry = {
                     id: crypto.randomUUID(),
                     tenantId,
                     productId: produce.productId,
                     locationId: produce.locationId,
                     batchId: targetBatch,
                     quantity: produce.quantity,
                     reservedQuantity: 0,
                     createdAt: new Date().toISOString(),
                     updatedAt: new Date().toISOString()
                 };
                 updates.push({
                     key: ['tenants', tenantId, 'stock', produce.productId, produce.locationId, targetBatch],
                     versionstamp: null,
                     value: newEntry
                 });
             }
             affectedProducts.add(produce.productId);

             movements.push({
                 id: crypto.randomUUID(),
                 tenantId,
                 productId: produce.productId,
                 quantity: produce.quantity,
                 type: 'produced',
                 toLocationId: produce.locationId,
                 batchId: targetBatch,
                 referenceId: reason,
                 timestamp: new Date().toISOString()
             });

             // 4. Commit
             const success = await stockRepository.commitUpdates(tenantId, updates);
             if (!success) {
                 if (attempt === MAX_RETRIES) throw new Error('Production failed due to concurrency');
                 await new Promise(r => setTimeout(r, Math.random() * 50));
                 continue;
             }

             // 5. Log Movements & Update Totals
             await Promise.all(movements.map(m => stockMovementRepository.save(tenantId, m)));
             for (const pid of affectedProducts) {
                 await _updateProductTotal(tenantId, pid);
             }
             return;

         } catch (e) {
             if (e.message.includes('Insufficient stock')) throw e;
             if (attempt === MAX_RETRIES) throw e;
         }
     }
  };

  // NEW: Robust Reception (Forces Batch ID)
  const receiveStockRobust = async (tenantId, { productId, locationId, quantity, batchId, reason }) => {
      // 1. Determine Batch ID
      const finalBatchId = batchId || `REC-${new Date().toISOString().slice(0,10)}-${crypto.randomUUID().slice(0,4)}`;

      const MAX_RETRIES = 5;
      let attempt = 0;

      while (attempt < MAX_RETRIES) {
          attempt++;
          try {
              const entries = await stockRepository.getEntriesWithVersion(tenantId, productId);
              const existing = entries.find(e => e.value.locationId === locationId && e.value.batchId === finalBatchId);

              const updates = [];
              if (existing) {
                  updates.push({
                      key: existing.key,
                      versionstamp: existing.versionstamp,
                      value: {
                          ...existing.value,
                          quantity: existing.value.quantity + quantity,
                          updatedAt: new Date().toISOString()
                      }
                  });
              } else {
                  const newEntry = {
                      id: crypto.randomUUID(),
                      tenantId,
                      productId,
                      locationId,
                      batchId: finalBatchId,
                      quantity: quantity,
                      reservedQuantity: 0,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                  };
                  updates.push({
                      key: ['tenants', tenantId, 'stock', productId, locationId, finalBatchId],
                      versionstamp: null,
                      value: newEntry
                  });
              }

              const success = await stockRepository.commitUpdates(tenantId, updates);
              if (!success) {
                  await new Promise(r => setTimeout(r, Math.random() * 50));
                  continue;
              }

              await stockMovementRepository.save(tenantId, {
                  id: crypto.randomUUID(),
                  tenantId,
                  productId,
                  quantity,
                  type: 'received',
                  toLocationId: locationId,
                  batchId: finalBatchId,
                  referenceId: reason,
                  timestamp: new Date().toISOString()
              });

              // Update Product Total
              await _updateProductTotal(tenantId, productId);
              return;

          } catch (e) {
              if (attempt === MAX_RETRIES) throw e;
          }
      }
  };

  return { allocate, commit, release, allocateBatch, executeProduction, receiveStockRobust };
};
