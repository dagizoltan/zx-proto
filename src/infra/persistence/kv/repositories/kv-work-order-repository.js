export const createKVWorkOrderRepository = (kvPool) => {
  const save = async (tenantId, wo) => {
    return kvPool.withConnection(async (kv) => {
      const key = ['tenants', tenantId, 'work_orders', wo.id];
      await kv.set(key, wo);
      return wo;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const key = ['tenants', tenantId, 'work_orders', id];
      const res = await kv.get(key);
      return res.value;
    });
  };

  const findAll = async (tenantId, { limit = 100, cursor } = {}) => {
    return kvPool.withConnection(async (kv) => {
      const prefix = ['tenants', tenantId, 'work_orders'];
      const iter = kv.list({ prefix }, { limit, cursor });
      const items = [];
      for await (const entry of iter) {
        items.push(entry.value);
      }
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { items, nextCursor: iter.cursor };
    });
  };

  return { save, findById, findAll };
};
