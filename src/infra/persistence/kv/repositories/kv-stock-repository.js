// Replacing the simple stock repo with a multi-location capable one
// We will index stock by:
// ['tenants', tenantId, 'stock', productId, locationId]
// ['tenants', tenantId, 'stock_by_loc', locationId, productId]

export const createKVStockRepository = (kvPool) => {
  const save = async (tenantId, stockEntry) => {
    return kvPool.withConnection(async (kv) => {
      const op = kv.atomic();
      const key = ['tenants', tenantId, 'stock', stockEntry.productId, stockEntry.locationId];
      op.set(key, stockEntry);
      // Secondary index for location lookup
      op.set(['tenants', tenantId, 'stock_by_loc', stockEntry.locationId, stockEntry.productId], stockEntry.id);
      await op.commit();
      return stockEntry;
    });
  };

  const getEntry = async (tenantId, productId, locationId) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'stock', productId, locationId]);
      return res.value;
    });
  };

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

  // Deprecated direct update, use specific movement logic in services
  const updateStock = async (tenantId, productId, quantity) => {
      // Compatibility shim: update a 'default' location
      const defaultLocId = 'default-loc';
      const entry = await getEntry(tenantId, productId, defaultLocId) || {
          id: crypto.randomUUID(),
          tenantId,
          productId,
          locationId: defaultLocId,
          quantity: 0,
          reservedQuantity: 0
      };

      const updated = { ...entry, quantity, updatedAt: new Date().toISOString() };
      await save(tenantId, updated);
      return updated;
  };

  return { save, getEntry, getEntriesForProduct, getStock, updateStock };
};
