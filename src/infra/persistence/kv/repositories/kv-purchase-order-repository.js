export const createKVPurchaseOrderRepository = (kvPool) => {
  const save = async (tenantId, po) => {
    return kvPool.withConnection(async (kv) => {
      const key = ['tenants', tenantId, 'purchase_orders', po.id];
      await kv.set(key, po);
      return po;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const key = ['tenants', tenantId, 'purchase_orders', id];
      const res = await kv.get(key);
      return res.value;
    });
  };

  const findAll = async (tenantId, { limit = 100, cursor } = {}) => {
    return kvPool.withConnection(async (kv) => {
      const prefix = ['tenants', tenantId, 'purchase_orders'];
      const iter = kv.list({ prefix }, { limit, cursor });
      const items = [];
      for await (const entry of iter) {
        items.push(entry.value);
      }
      // Reverse sort by createdAt
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { items, nextCursor: iter.cursor };
    });
  };

  return { save, findById, findAll };
};
