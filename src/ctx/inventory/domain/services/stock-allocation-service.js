import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createStockAllocationService = (stockRepository, stockMovementRepository, batchRepository, productRepository, kvPool) => {

  // Helper for manual commit retry
  const commitWithRetry = async (atomic) => {
      const MAX_RETRIES = 5;
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
          attempt++;
          try {
              const res = await atomic.commit();
              return Ok(res);
          } catch (e) {
              if (e.message && (e.message.includes('database is locked') || e.name === 'TypeError')) {
                  const delay = Math.random() * 50 * attempt;
                  await new Promise(r => setTimeout(r, delay));
                  continue;
              }
              return Err({ code: 'COMMIT_ERROR', message: e.message });
          }
      }
      return Err({ code: 'TIMEOUT', message: 'Database locked after retries' });
  };

  const allocate = async (tenantId, productId, amount, referenceId) => {
    return allocateBatch(tenantId, [{ productId, quantity: amount }], referenceId);
  };

  const allocateBatch = async (tenantId, items, referenceId) => {
    const MAX_RETRIES = 10;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        attempt++;

        const result = await kvPool.withConnection(async (kv) => {
            const atomic = kv.atomic();

            const productIds = [...new Set(items.map(i => i.productId))];
            const stockMap = new Map();

            for (const pid of productIds) {
                const res = await stockRepository.queryByIndex(tenantId, 'product', pid, { limit: 1000 });
                if (isErr(res)) return res;
                stockMap.set(pid, res.value.items);
            }

            const movements = [];

            for (const req of items) {
                const entries = stockMap.get(req.productId) || [];
                entries.sort((a, b) => (b.quantity - b.reservedQuantity) - (a.quantity - a.reservedQuantity));

                let remaining = req.quantity;
                let availableTotal = entries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0);

                if (availableTotal < remaining) {
                    return Err({ code: 'INSUFFICIENT_STOCK', message: `Insufficient stock for ${req.productId}` });
                }

                for (const entry of entries) {
                    if (remaining <= 0) break;
                    const available = entry.quantity - entry.reservedQuantity;
                    if (available <= 0) continue;

                    const take = Math.min(available, remaining);

                    const newValue = {
                        ...entry,
                        reservedQuantity: entry.reservedQuantity + take,
                        updatedAt: new Date().toISOString()
                    };

                    const saveRes = await stockRepository.save(tenantId, newValue, { atomic });
                    if (isErr(saveRes)) return saveRes;

                    movements.push({
                        id: crypto.randomUUID(),
                        tenantId,
                        productId: req.productId,
                        quantity: take,
                        type: 'ALLOCATION',
                        locationId: entry.locationId,
                        referenceId,
                        batchId: entry.batchId,
                        timestamp: new Date().toISOString()
                    });

                    remaining -= take;
                }
            }

            for (const m of movements) {
                const mRes = await stockMovementRepository.save(tenantId, m, { atomic });
                if (isErr(mRes)) return mRes;
            }

            const commitRes = await commitWithRetry(atomic);
            if (!commitRes.ok) return commitRes; // TIMEOUT or COMMIT_ERROR

            const commitValue = commitRes.value;
            if (!commitValue.ok) {
                return Err({ code: 'CONFLICT', message: 'Concurrency conflict' });
            }
            return Ok(true);
        });

        if (isErr(result)) {
            if (result.error.code === 'CONFLICT' || result.error.code === 'COMMIT_FAILED' || result.error.code === 'TIMEOUT') {
                const delay = Math.random() * 100 * attempt;
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            return result;
        }
        return result;
    }
    return Err({ code: 'TIMEOUT', message: 'Allocation failed after retries' });
  };

  const commit = async (tenantId, referenceId, itemsToShip = null) => {
      const movesRes = await stockMovementRepository.queryByIndex(tenantId, 'reference', referenceId, { limit: 1000 });
      if (isErr(movesRes)) return movesRes;

      const movements = movesRes.value.items.filter(m => m.type === 'ALLOCATION');
      if (movements.length === 0) return Ok(true);

      const MAX_RETRIES = 10;
      let attempt = 0;

      while (attempt < MAX_RETRIES) {
          attempt++;
          const result = await kvPool.withConnection(async (kv) => {
              const atomic = kv.atomic();

              const productIds = [...new Set(movements.map(m => m.productId))];
              const stockMap = new Map();
              for (const pid of productIds) {
                  const res = await stockRepository.queryByIndex(tenantId, 'product', pid, { limit: 1000 });
                  if (isErr(res)) return res;
                  stockMap.set(pid, res.value.items);
              }

              const newMovements = [];

              for (const m of movements) {
                  const entries = stockMap.get(m.productId);
                  const entry = entries.find(e => e.locationId === m.locationId && e.batchId === m.batchId);

                  if (!entry) continue;

                  const newValue = {
                      ...entry,
                      quantity: entry.quantity - m.quantity,
                      reservedQuantity: entry.reservedQuantity - m.quantity,
                      updatedAt: new Date().toISOString()
                  };

                  const saveRes = await stockRepository.save(tenantId, newValue, { atomic });
                  if (isErr(saveRes)) return saveRes;

                  newMovements.push({
                      id: crypto.randomUUID(),
                      tenantId,
                      productId: m.productId,
                      quantity: m.quantity,
                      type: 'OUTBOUND',
                      locationId: m.locationId,
                      referenceId,
                      batchId: m.batchId,
                      timestamp: new Date().toISOString()
                  });
              }

              for (const m of newMovements) {
                  const mRes = await stockMovementRepository.save(tenantId, m, { atomic });
                  if (isErr(mRes)) return mRes;
              }

              const commitRes = await commitWithRetry(atomic);
              if (!commitRes.ok) return commitRes;
              if (!commitRes.value.ok) return Err({ code: 'CONFLICT' });
              return Ok(true);
          });

          if (isErr(result)) {
              if (result.error.code === 'CONFLICT' || result.error.code === 'TIMEOUT') {
                  const delay = Math.random() * 50 * attempt;
                  await new Promise(r => setTimeout(r, delay));
                  continue;
              }
              return result;
          }
          return result;
      }
      return Err({ code: 'TIMEOUT', message: 'Commit failed' });
  };

  const release = async (tenantId, referenceId) => {
      const movesRes = await stockMovementRepository.queryByIndex(tenantId, 'reference', referenceId, { limit: 1000 });
      if (isErr(movesRes)) return movesRes;
      const movements = movesRes.value.items.filter(m => m.type === 'ALLOCATION');

      const MAX_RETRIES = 5;
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
          attempt++;
          const result = await kvPool.withConnection(async (kv) => {
              const atomic = kv.atomic();
              const stockMap = new Map();
              const productIds = [...new Set(movements.map(m => m.productId))];
              for (const pid of productIds) {
                  const res = await stockRepository.queryByIndex(tenantId, 'product', pid, { limit: 1000 });
                  if (isErr(res)) return res;
                  stockMap.set(pid, res.value.items);
              }

              const newMovements = [];
              for (const m of movements) {
                  const entries = stockMap.get(m.productId);
                  const entry = entries.find(e => e.locationId === m.locationId && e.batchId === m.batchId);
                  if (!entry) continue;

                  const newValue = {
                      ...entry,
                      reservedQuantity: entry.reservedQuantity - m.quantity,
                      updatedAt: new Date().toISOString()
                  };
                  const saveRes = await stockRepository.save(tenantId, newValue, { atomic });
                  if (isErr(saveRes)) return saveRes;

                  newMovements.push({
                      id: crypto.randomUUID(),
                      tenantId,
                      productId: m.productId,
                      quantity: m.quantity,
                      type: 'ADJUSTMENT',
                      locationId: m.locationId,
                      reason: 'Release Allocation',
                      referenceId,
                      batchId: m.batchId,
                      timestamp: new Date().toISOString()
                  });
              }

               for (const m of newMovements) {
                  const mRes = await stockMovementRepository.save(tenantId, m, { atomic });
                  if (isErr(mRes)) return mRes;
              }

              const commitRes = await commitWithRetry(atomic);
              if (!commitRes.ok) return commitRes;
              if (!commitRes.value.ok) return Err({ code: 'CONFLICT' });
              return Ok(true);
          });

          if (isErr(result) && (result.error.code === 'CONFLICT' || result.error.code === 'TIMEOUT')) {
               await new Promise(r => setTimeout(r, Math.random() * 50));
               continue;
          }
          return result;
      }
      return Err({ code: 'TIMEOUT', message: 'Release failed' });
  };

  const receiveStockRobust = async (tenantId, { productId, locationId, quantity, batchId, reason }) => {
      // Single item receive
      const finalBatchId = batchId || 'default';
      const MAX_RETRIES = 5;
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
          attempt++;
          const result = await kvPool.withConnection(async (kv) => {
             const atomic = kv.atomic();
             const res = await stockRepository.queryByIndex(tenantId, 'product', productId, { limit: 1000 });
             if (isErr(res)) return res;

             const existing = res.value.items.find(e => e.locationId === locationId && e.batchId === finalBatchId);

             if (existing) {
                 const newValue = { ...existing, quantity: existing.quantity + quantity, updatedAt: new Date().toISOString() };
                 await stockRepository.save(tenantId, newValue, { atomic });
             } else {
                 const newEntry = {
                      id: crypto.randomUUID(),
                      tenantId,
                      productId,
                      locationId,
                      batchId: finalBatchId,
                      quantity: quantity,
                      reservedQuantity: 0,
                      updatedAt: new Date().toISOString()
                 };
                 await stockRepository.save(tenantId, newEntry, { atomic });
             }

             const m = {
                  id: crypto.randomUUID(),
                  tenantId,
                  productId,
                  quantity,
                  type: 'INBOUND',
                  locationId,
                  reason,
                  batchId: finalBatchId,
                  timestamp: new Date().toISOString()
             };
             await stockMovementRepository.save(tenantId, m, { atomic });

             const commitRes = await commitWithRetry(atomic);
             if (!commitRes.ok) return commitRes;
             if (!commitRes.value.ok) return Err({ code: 'CONFLICT' });
             return Ok(true);
          });

          if (isErr(result) && (result.error.code === 'CONFLICT' || result.error.code === 'TIMEOUT')) {
              await new Promise(r => setTimeout(r, Math.random() * 50));
              continue;
          }
          return result;
      }
      return Err({ code: 'TIMEOUT' });
  };

  const executeProduction = async (tenantId, { consume, produce, reason }) => {
      const MAX_RETRIES = 5;
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
          attempt++;
          const result = await kvPool.withConnection(async (kv) => {
              const atomic = kv.atomic();

              const allPids = [...new Set([...consume.map(c => c.productId), produce.productId])];
              const stockMap = new Map();
               for (const pid of allPids) {
                  const res = await stockRepository.queryByIndex(tenantId, 'product', pid, { limit: 1000 });
                  if (isErr(res)) return res;
                  stockMap.set(pid, res.value.items);
              }

              for (const item of consume) {
                  const entries = stockMap.get(item.productId);
                  const locEntries = entries.filter(e => e.locationId === item.locationId);

                  let remaining = item.quantity;
                  for (const e of locEntries) {
                      if (remaining <= 0) break;
                      if (e.quantity <= 0) continue;
                      const take = Math.min(e.quantity, remaining);

                      const newValue = { ...e, quantity: e.quantity - take, updatedAt: new Date().toISOString() };
                      await stockRepository.save(tenantId, newValue, { atomic });

                      const m = {
                          id: crypto.randomUUID(),
                          tenantId,
                          productId: item.productId,
                          quantity: take,
                          type: 'PRODUCTION_CONSUME',
                          locationId: item.locationId,
                          reason,
                          batchId: e.batchId,
                          timestamp: new Date().toISOString()
                      };
                      await stockMovementRepository.save(tenantId, m, { atomic });
                      remaining -= take;
                  }
                  if (remaining > 0) return Err({ code: 'INSUFFICIENT_STOCK', message: `Not enough ${item.productId}` });
              }

              const pEntries = stockMap.get(produce.productId) || [];
              const batchId = produce.batchId || 'default';
              const existing = pEntries.find(e => e.locationId === produce.locationId && e.batchId === batchId);

              if (existing) {
                   const newValue = { ...existing, quantity: existing.quantity + produce.quantity, updatedAt: new Date().toISOString() };
                   await stockRepository.save(tenantId, newValue, { atomic });
              } else {
                   const newEntry = {
                      id: crypto.randomUUID(),
                      tenantId,
                      productId: produce.productId,
                      locationId: produce.locationId,
                      batchId,
                      quantity: produce.quantity,
                      reservedQuantity: 0,
                      updatedAt: new Date().toISOString()
                   };
                   await stockRepository.save(tenantId, newEntry, { atomic });
              }

              const m = {
                  id: crypto.randomUUID(),
                  tenantId,
                  productId: produce.productId,
                  quantity: produce.quantity,
                  type: 'PRODUCTION_OUTPUT',
                  locationId: produce.locationId,
                  reason,
                  batchId,
                  timestamp: new Date().toISOString()
              };
              await stockMovementRepository.save(tenantId, m, { atomic });

              const commitRes = await commitWithRetry(atomic);
              if (!commitRes.ok) return commitRes;
              if (!commitRes.value.ok) return Err({ code: 'CONFLICT' });
              return Ok(true);
          });

          if (isErr(result) && (result.error.code === 'CONFLICT' || result.error.code === 'TIMEOUT')) {
               await new Promise(r => setTimeout(r, Math.random() * 50));
               continue;
          }
          return result;
      }
      return Err({ code: 'TIMEOUT' });
  };

  const receiveStockBatch = async (tenantId, { items, reason }) => {
      const MAX_RETRIES = 5;
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
          attempt++;
          const result = await kvPool.withConnection(async (kv) => {
              const atomic = kv.atomic();
              const productIds = [...new Set(items.map(i => i.productId))];
               const stockMap = new Map();
               for (const pid of productIds) {
                  const res = await stockRepository.queryByIndex(tenantId, 'product', pid, { limit: 1000 });
                  if (isErr(res)) return res;
                  stockMap.set(pid, res.value.items);
              }

              for (const item of items) {
                  const { productId, locationId, quantity, batchId } = item;
                  const finalBatchId = batchId || 'default';
                  const entries = stockMap.get(productId) || [];
                  const existing = entries.find(e => e.locationId === locationId && e.batchId === finalBatchId);

                  if (existing) {
                      const newValue = { ...existing, quantity: existing.quantity + quantity, updatedAt: new Date().toISOString() };
                      await stockRepository.save(tenantId, newValue, { atomic });
                  } else {
                      const newEntry = {
                          id: crypto.randomUUID(),
                          tenantId,
                          productId,
                          locationId,
                          batchId: finalBatchId,
                          quantity,
                          reservedQuantity: 0,
                          updatedAt: new Date().toISOString()
                      };
                      await stockRepository.save(tenantId, newEntry, { atomic });
                  }
                  const m = {
                      id: crypto.randomUUID(),
                      tenantId,
                      productId,
                      quantity,
                      type: 'INBOUND',
                      locationId,
                      reason,
                      batchId: finalBatchId,
                      timestamp: new Date().toISOString()
                  };
                  await stockMovementRepository.save(tenantId, m, { atomic });
              }
              const commitRes = await commitWithRetry(atomic);
              if (!commitRes.ok) return commitRes;
              if (!commitRes.value.ok) return Err({ code: 'CONFLICT' });
              return Ok(true);
          });
           if (isErr(result) && (result.error.code === 'CONFLICT' || result.error.code === 'TIMEOUT')) {
               await new Promise(r => setTimeout(r, Math.random() * 50));
               continue;
          }
          return result;
      }
      return Err({ code: 'TIMEOUT' });
  };

  return { allocate, allocateBatch, commit, release, executeProduction, receiveStockRobust, receiveStockBatch };
};
