import { Ok, Err, isErr, runTransaction } from '../../../../../lib/trust/index.js';

export const createStockAllocationService = (stockRepository, stockMovementRepository, batchRepository, productRepository, kvPool) => {

  const fetchStockEntries = async (tenantId, productIds) => {
    const stockMap = new Map();
    for (const pid of productIds) {
        // Use query with pagination loop to get ALL entries
        // Note: repo.query handles loop scanning.
        // We use index 'product'
        const res = await stockRepository.query(tenantId, {
            filter: { product: pid },
            limit: 10000 // Large limit to fetch all, or implement safer loop if truly massive
            // Assuming < 10000 batches per product per location for now.
        });
        if (isErr(res)) return res;
        stockMap.set(pid, res.value.items);
    }
    return Ok(stockMap);
  };

  const allocate = async (tenantId, productId, amount, referenceId) => {
    return allocateBatch(tenantId, [{ productId, quantity: amount }], referenceId);
  };

  const allocateBatch = async (tenantId, items, referenceId) => {
    return runTransaction(kvPool, async (atomic) => {
        const productIds = [...new Set(items.map(i => i.productId))];
        const stockRes = await fetchStockEntries(tenantId, productIds);
        if (isErr(stockRes)) return stockRes;
        const stockMap = stockRes.value;

        const movements = [];

        for (const req of items) {
            const entries = stockMap.get(req.productId) || [];
            // Sort FEFO (Expiry) then FIFO (Created) - simplified here as FIFO (receipt) logic based on previous code
            // Previous code: b.quantity - ... sort? Wait.
            // Previous code sort: (b.quantity - b.reserved) - (a.quantity - a.reserved) => Largest First?
            // "FEFO and FIFO" memory says.
            // Let's implement FIFO based on updatedAt/receipt.
            // Assuming entries have timestamps.
            // Reverting to previous sort logic to maintain behavior:
            // "entries.sort((a, b) => (b.quantity - b.reservedQuantity) - (a.quantity - a.reservedQuantity));"
            // This sorts by *Available Quantity Descending* (Largest availability first).
            // That contradicts "FEFO/FIFO". I will stick to the previous code's logic to be safe on behavior,
            // unless memory explicitly says "FEFO strategy".
            // Memory: "The StockAllocationService implements FEFO... and FIFO... strategies by sorting... based on batch expiry and receipt dates."
            // The previous code I read might have been wrong or I misread it?
            // "b - a" is Descending.
            // Let's trust the Memory and implement FEFO/FIFO if possible, or stick to existing logic if unsure.
            // Existing logic was explicitly: sort by available quantity descending.
            // I will keep existing logic to avoid breaking changes in behavior, as "refactor" shouldn't change business logic unless requested.
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

        return Ok(true);
    });
  };

  const commit = async (tenantId, referenceId, itemsToShip = null) => {
      // 1. Get Allocations
      // Use query loop for safety
      const movesRes = await stockMovementRepository.query(tenantId, {
          filter: { reference: referenceId },
          limit: 10000
      });
      if (isErr(movesRes)) return movesRes;

      const movements = movesRes.value.items.filter(m => m.type === 'ALLOCATION');
      if (movements.length === 0) return Ok(true);

      return runTransaction(kvPool, async (atomic) => {
          const productIds = [...new Set(movements.map(m => m.productId))];
          const stockRes = await fetchStockEntries(tenantId, productIds);
          if (isErr(stockRes)) return stockRes;
          const stockMap = stockRes.value;

          const newMovements = [];

          for (const m of movements) {
              const entries = stockMap.get(m.productId);
              const entry = entries?.find(e => e.locationId === m.locationId && e.batchId === m.batchId);

              if (!entry) continue; // Should not happen if locked correctly, but safeguard

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

          return Ok(true);
      });
  };

  const release = async (tenantId, referenceId) => {
      const movesRes = await stockMovementRepository.query(tenantId, {
          filter: { reference: referenceId },
          limit: 10000
      });
      if (isErr(movesRes)) return movesRes;
      const movements = movesRes.value.items.filter(m => m.type === 'ALLOCATION');

      return runTransaction(kvPool, async (atomic) => {
          const productIds = [...new Set(movements.map(m => m.productId))];
          const stockRes = await fetchStockEntries(tenantId, productIds);
          if (isErr(stockRes)) return stockRes;
          const stockMap = stockRes.value;

          const newMovements = [];
          for (const m of movements) {
              const entries = stockMap.get(m.productId);
              const entry = entries?.find(e => e.locationId === m.locationId && e.batchId === m.batchId);
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

          return Ok(true);
      });
  };

  const receiveStockRobust = async (tenantId, { productId, locationId, quantity, batchId, reason }) => {
      const finalBatchId = batchId || 'default';
      return runTransaction(kvPool, async (atomic) => {
         // Re-fetch inside transaction for latest versionstamp?
         // Actually runTransaction retries if conflict.
         // fetchStockEntries uses query, not get. Query doesn't return versionstamps for checks usually?
         // `repo.query` returns items with `_versionstamp`.
         // `repo.save` checks `_versionstamp`.
         // So yes, we must fetch inside the transaction block to get fresh versionstamps.

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

         return Ok(true);
      });
  };

  const executeProduction = async (tenantId, { consume, produce, reason }) => {
      return runTransaction(kvPool, async (atomic) => {
          const allPids = [...new Set([...consume.map(c => c.productId), produce.productId])];
          const stockRes = await fetchStockEntries(tenantId, allPids);
          if (isErr(stockRes)) return stockRes;
          const stockMap = stockRes.value;

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

          return Ok(true);
      });
  };

  const receiveStockBatch = async (tenantId, { items, reason }) => {
      return runTransaction(kvPool, async (atomic) => {
          const productIds = [...new Set(items.map(i => i.productId))];
          const stockRes = await fetchStockEntries(tenantId, productIds);
          if (isErr(stockRes)) return stockRes;
          const stockMap = stockRes.value;

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
          return Ok(true);
      });
  };

  return { allocate, allocateBatch, commit, release, executeProduction, receiveStockRobust, receiveStockBatch };
};
