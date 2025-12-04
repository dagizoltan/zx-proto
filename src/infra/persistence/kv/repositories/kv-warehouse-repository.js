export const createKVWarehouseRepository = (kvPool) => {
  const save = async (tenantId, warehouse) => {
    return kvPool.withConnection(async (kv) => {
      await kv.set(['tenants', tenantId, 'warehouses', warehouse.id], warehouse);
      return warehouse;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'warehouses', id]);
      return res.value;
    });
  };

  const findAll = async (tenantId) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'warehouses'] });
      const items = [];
      for await (const res of iter) items.push(res.value);
      return items;
    });
  };

  return { save, findById, findAll };
};
