export const createKVBillOfMaterialsRepository = (kvPool) => {
  const save = async (tenantId, bom) => {
    return kvPool.withConnection(async (kv) => {
      const key = ['tenants', tenantId, 'boms', bom.id];
      await kv.set(key, bom);
      return bom;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const key = ['tenants', tenantId, 'boms', id];
      const res = await kv.get(key);
      return res.value;
    });
  };

  const findAll = async (tenantId, { limit = 100, cursor } = {}) => {
    return kvPool.withConnection(async (kv) => {
      const prefix = ['tenants', tenantId, 'boms'];
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
