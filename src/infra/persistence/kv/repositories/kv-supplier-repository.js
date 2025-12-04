export const createKVSupplierRepository = (kvPool) => {
  const save = async (tenantId, supplier) => {
    return kvPool.withConnection(async (kv) => {
      const key = ['tenants', tenantId, 'suppliers', supplier.id];
      await kv.set(key, supplier);
      return supplier;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const key = ['tenants', tenantId, 'suppliers', id];
      const res = await kv.get(key);
      return res.value;
    });
  };

  const findAll = async (tenantId, { limit = 100, cursor } = {}) => {
    return kvPool.withConnection(async (kv) => {
      const prefix = ['tenants', tenantId, 'suppliers'];
      const iter = kv.list({ prefix }, { limit, cursor });
      const items = [];
      for await (const entry of iter) {
        items.push(entry.value);
      }
      return { items, nextCursor: iter.cursor };
    });
  };

  return { save, findById, findAll };
};
