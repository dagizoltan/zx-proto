// Replacing the simple stock repo with a multi-location capable one
// We will index stock by:
// ['tenants', tenantId, 'stock', productId, locationId, batchId]
// ['tenants', tenantId, 'stock_by_loc', locationId, productId, batchId]

export const createKVStockRepository = (kvPool) => {
  const save = async (tenantId, stockEntry) => {
    return kvPool.withConnection(async (kv) => {
      const batchId = stockEntry.batchId || 'default';
      const op = kv.atomic();
      const key = ['tenants', tenantId, 'stock', stockEntry.productId, stockEntry.locationId, batchId];
      op.set(key, stockEntry);

      // Secondary index for location lookup
      op.set(['tenants', tenantId, 'stock_by_loc', stockEntry.locationId, stockEntry.productId, batchId], stockEntry.id);

      await op.commit();
      return stockEntry;
    });
  };

  const getEntryByBatch = async (tenantId, productId, locationId, batchId) => {
    return kvPool.withConnection(async (kv) => {
      const finalBatchId = batchId || 'default';
      const res = await kv.get(['tenants', tenantId, 'stock', productId, locationId, finalBatchId]);
      return res.value;
    });
  };

  const getEntriesAtLocation = async (tenantId, productId, locationId) => {
    return kvPool.withConnection(async (kv) => {
      // New Key: ['tenants', tenantId, 'stock', productId, locationId, batchId]
      // Prefix matching ['tenants', tenantId, 'stock', productId, locationId] captures all batches at this location.
      const iter = kv.list({ prefix: ['tenants', tenantId, 'stock', productId, locationId] });
      const entries = [];
      for await (const res of iter) {
        entries.push(res.value);
      }
      return entries;
    });
  };

  // Paginated version for UI
  const listEntriesForProduct = async (tenantId, productId, { limit = 50, cursor } = {}) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'stock', productId] }, { limit, cursor });
      const entries = [];
      for await (const res of iter) {
        entries.push(res.value);
      }
      return { items: entries, nextCursor: iter.cursor };
    });
  };

  // Full fetch for Domain Logic (Allocation Service)
  const getEntriesForProduct = async (tenantId, productId) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'stock', productId] });
      const entries = [];
      for await (const res of iter) {
        entries.push(res.value);
      }
      return entries;
    });
  };

  // Keep the old 'getStock' signature for compatibility, but aggregate
  const getStock = async (tenantId, productId) => {
    const entries = await getEntriesForProduct(tenantId, productId);
    return entries.reduce((sum, entry) => sum + (entry.quantity - entry.reservedQuantity), 0);
  };

  // Deprecated direct update shim
  const updateStock = async (tenantId, productId, quantity) => {
      const defaultLocId = 'default-loc';
      const entry = await getEntryByBatch(tenantId, productId, defaultLocId, null) || {
          id: crypto.randomUUID(),
          tenantId,
          productId,
          locationId: defaultLocId,
          quantity: 0,
          reservedQuantity: 0,
          batchId: 'default'
      };

      const updated = { ...entry, quantity, updatedAt: new Date().toISOString() };
      await save(tenantId, updated);
      return updated;
  };

  return { save, getEntryByBatch, getEntriesAtLocation, getEntriesForProduct, listEntriesForProduct, getStock, updateStock };
};
