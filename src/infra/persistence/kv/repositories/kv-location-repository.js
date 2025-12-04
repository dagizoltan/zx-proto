export const createKVLocationRepository = (kvPool) => {
  const save = async (tenantId, location) => {
    return kvPool.withConnection(async (kv) => {
      await kv.set(['tenants', tenantId, 'locations', location.id], location);
      // Secondary index for warehouse lookup?
      // await kv.set(['tenants', tenantId, 'warehouse_locations', location.warehouseId, location.id], location);
      return location;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'locations', id]);
      return res.value;
    });
  };

  const findByWarehouseId = async (tenantId, warehouseId) => {
    // Naive filter
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'locations'] });
      const items = [];
      for await (const res of iter) {
        if (res.value.warehouseId === warehouseId) items.push(res.value);
      }
      return items;
    });
  };

  return { save, findById, findByWarehouseId };
};
