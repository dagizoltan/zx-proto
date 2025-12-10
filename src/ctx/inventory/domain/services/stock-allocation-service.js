// Service to handle complex allocation logic
export const createStockAllocationService = (stockRepository, stockMovementRepository, batchRepository, productRepository) => {

  // Deprecated: Inefficient total calculation.
  const _updateProductTotal = async (tenantId, productId) => {
    if (!productRepository) return;
    const entries = await stockRepository.getEntriesForProduct(tenantId, productId);
    const total = entries.reduce((sum, e) => sum + e.quantity, 0);
    const product = await productRepository.findById(tenantId, productId);
    if (product) {
        await productRepository.save(tenantId, { ...product, quantity: total });
    }
  };

  // Helper for Issue #6 (Time Sort) & #3 (Atomic Log)
  const getMovementKey = (tenantId, movement) => {
      // Reverse chronological order: Max Int - Timestamp
      const ts = new Date(movement.timestamp).getTime();
      const revTs = (Number.MAX_SAFE_INTEGER - ts).toString().padStart(20, '0');
      return ['tenants', tenantId, 'movements', movement.productId, revTs, movement.id];
  };

  const allocate = async (tenantId, productId, amount, referenceId) => {
    await allocateBatch(tenantId, [{ productId, quantity: amount }], referenceId);
  };

  const allocateBatch = async (tenantId, items, referenceId) => {
    const MAX_RETRIES = 5;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        attempt++;
        try {
            const productIds = [...new Set(items.map(i => i.productId))];
            const stockMap = new Map();

            await Promise.all(productIds.map(async (pid) => {
                const entries = await stockRepository.getEntriesWithVersion(tenantId, pid);
                stockMap.set(pid, entries);
            }));

            const updates = [];
            const movements = [];

            // Gather all needed batch IDs across all items/entries
            const batchIdsToFetch = new Set();
            for (const req of items) {
                const entries = stockMap.get(req.productId) || [];
                for (const e of entries) {
                    if (e.value.batchId && e.value.batchId !== 'default') {
                        batchIdsToFetch.add(e.value.batchId);
                    }
                }
            }

            let batchMap = new Map();
            if (batchRepository && batchIdsToFetch.size > 0) {
                 const batches = await batchRepository.findByIds(tenantId, Array.from(batchIdsToFetch));
                 batches.forEach(b => batchMap.set(b.id, b));
            }

            for (const req of items) {
                const entries = stockMap.get(req.productId) || [];

                const enriched = entries.map(e => {
                    let batch = null;
                    if (e.value.batchId && e.value.batchId !== 'default') {
                         batch = batchMap.get(e.value.batchId) || null;
                    }
                    return { ...e, batch };
                });

                enriched.sort((a, b) => {
                    const expiryA = a.batch?.expiryDate ? new Date(a.batch.expiryDate).getTime() : Infinity;
                    const expiryB = b.batch?.expiryDate ? new Date(b.batch.expiryDate).getTime() : Infinity;
                    if (expiryA !== expiryB) return expiryA - expiryB;

                    const receivedA = a.batch?.receivedAt ? new Date(a.batch.receivedAt).getTime() : 0;
                    const receivedB = b.batch?.receivedAt ? new Date(b.batch.receivedAt).getTime() : 0;
                    return receivedA - receivedB;
                });

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

            // Fix #3: Add movements to atomic batch
            for (const m of movements) {
                updates.push({
                    key: getMovementKey(tenantId, m),
                    versionstamp: null,
                    value: m
                });
            }

            if (updates.length > 0) {
                const success = await stockRepository.commitUpdates(tenantId, updates);
                if (!success) {
                    if (attempt === MAX_RETRIES) throw new Error('Failed to allocate stock after multiple attempts (High Concurrency)');
                    await new Promise(r => setTimeout(r, Math.random() * 50));
                    continue;
                }
            }

            // Movements are now saved atomically. No need for post-commit save.
            return;

        } catch (e) {
            if (e.message.includes('Insufficient stock')) throw e;
            if (attempt === MAX_RETRIES) throw e;
        }
    }
  };

  const commit = async (tenantId, referenceId, itemsToShip = null) => {
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

    const toShip = [];
    const affectedProducts = new Set();

    if (!itemsToShip) {
        for (const [key, rec] of inventoryMap.entries()) {
            const remaining = rec.allocated - rec.released - rec.shipped;
            if (remaining > 0) {
                toShip.push({ keyStr: key, quantity: remaining, ...rec.meta });
            }
        }
    } else {
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

    const updates = [];
    const newMovements = [];

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
            quantity: entry.value.quantity - quantity,
            reservedQuantity: entry.value.reservedQuantity - quantity,
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

    // Fix #3
    for (const m of newMovements) {
        updates.push({
            key: getMovementKey(tenantId, m),
            versionstamp: null,
            value: m
        });
    }

    if (updates.length > 0) {
        const success = await stockRepository.commitUpdates(tenantId, updates);
        if (!success) {
            throw new Error('Commit failed due to concurrent modification. Please retry.');
        }

        for (const pid of affectedProducts) {
             await _updateProductTotal(tenantId, pid);
        }
    }
  };

  const release = async (tenantId, referenceId) => {
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

            if (actions.length === 0) return;

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

                if (!entry) continue;

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

            // Fix #3
            for (const m of newMovements) {
                updates.push({
                    key: getMovementKey(tenantId, m),
                    versionstamp: null,
                    value: m
                });
            }

            if (updates.length > 0) {
                const success = await stockRepository.commitUpdates(tenantId, updates);
                if (!success) {
                    await new Promise(r => setTimeout(r, Math.random() * 50));
                    continue;
                }
            }
            return;

        } catch (e) {
            if (attempt === MAX_RETRIES) throw e;
        }
    }
  };

  const executeProduction = async (tenantId, { consume, produce, reason, userId }) => {
     const MAX_RETRIES = 5;
     let attempt = 0;

     while (attempt < MAX_RETRIES) {
         attempt++;
         try {
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

             // Fix #3
             for (const m of movements) {
                updates.push({
                    key: getMovementKey(tenantId, m),
                    versionstamp: null,
                    value: m
                });
             }

             const success = await stockRepository.commitUpdates(tenantId, updates);
             if (!success) {
                 if (attempt === MAX_RETRIES) throw new Error('Production failed due to concurrency');
                 await new Promise(r => setTimeout(r, Math.random() * 50));
                 continue;
             }

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

  const receiveStockRobust = async (tenantId, { productId, locationId, quantity, batchId, reason }) => {
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

              const movement = {
                  id: crypto.randomUUID(),
                  tenantId,
                  productId,
                  quantity,
                  type: 'received',
                  toLocationId: locationId,
                  batchId: finalBatchId,
                  referenceId: reason,
                  timestamp: new Date().toISOString()
              };

              // Fix #3
              updates.push({
                  key: getMovementKey(tenantId, movement),
                  versionstamp: null,
                  value: movement
              });

              const success = await stockRepository.commitUpdates(tenantId, updates);
              if (!success) {
                  await new Promise(r => setTimeout(r, Math.random() * 50));
                  continue;
              }

              await _updateProductTotal(tenantId, productId);
              return;

          } catch (e) {
              if (attempt === MAX_RETRIES) throw e;
          }
      }
  };

  const receiveStockBatch = async (tenantId, { items, reason }) => {
      // items: [{ productId, locationId, quantity, batchId }]
      const MAX_RETRIES = 5;
      let attempt = 0;

      while (attempt < MAX_RETRIES) {
          attempt++;
          try {
              const productIds = [...new Set(items.map(i => i.productId))];
              const stockMap = new Map();

              await Promise.all(productIds.map(async (pid) => {
                  const entries = await stockRepository.getEntriesWithVersion(tenantId, pid);
                  stockMap.set(pid, entries);
              }));

              const updates = [];
              const movements = [];
              const affectedProducts = new Set();

              for (const item of items) {
                  const { productId, locationId, quantity } = item;
                  const finalBatchId = item.batchId || `REC-${new Date().toISOString().slice(0,10)}-${crypto.randomUUID().slice(0,4)}`;

                  const entries = stockMap.get(productId) || [];
                  const existing = entries.find(e => e.value.locationId === locationId && e.value.batchId === finalBatchId);

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

                  const movement = {
                      id: crypto.randomUUID(),
                      tenantId,
                      productId,
                      quantity,
                      type: 'received',
                      toLocationId: locationId,
                      batchId: finalBatchId,
                      referenceId: reason,
                      timestamp: new Date().toISOString()
                  };
                  movements.push(movement);
                  affectedProducts.add(productId);
              }

              // Fix #3
              for (const m of movements) {
                  updates.push({
                      key: getMovementKey(tenantId, m),
                      versionstamp: null,
                      value: m
                  });
              }

              const success = await stockRepository.commitUpdates(tenantId, updates);
              if (!success) {
                  if (attempt === MAX_RETRIES) throw new Error('Batch receive failed due to concurrency');
                  await new Promise(r => setTimeout(r, Math.random() * 50));
                  continue;
              }

              for (const pid of affectedProducts) {
                  await _updateProductTotal(tenantId, pid);
              }
              return;

          } catch (e) {
              if (attempt === MAX_RETRIES) throw e;
          }
      }
  };

  return { allocate, commit, release, allocateBatch, executeProduction, receiveStockRobust, receiveStockBatch };
};
