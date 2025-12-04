export const createKVStockMovementRepository = (kvPool) => {
  const save = async (tenantId, movement) => {
    return kvPool.withConnection(async (kv) => {
      // Key: tenant -> movements -> productId -> timestamp_uuid
      await kv.set(['tenants', tenantId, 'movements', movement.productId, movement.id], movement);
      return movement;
    });
  };

  const getByProduct = async (tenantId, productId, limit = 50) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'movements', productId] }, { limit, reverse: true });
      const movements = [];
      for await (const res of iter) {
        movements.push(res.value);
      }
      return movements;
    });
  };

  return { save, getByProduct };
};
