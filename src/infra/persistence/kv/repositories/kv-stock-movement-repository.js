export const createKVStockMovementRepository = (kvPool) => {
  const save = async (tenantId, movement) => {
    return kvPool.withConnection(async (kv) => {
      const op = kv.atomic();
      // Key: tenant -> movements -> productId -> timestamp_uuid
      op.set(['tenants', tenantId, 'movements', movement.productId, movement.id], movement);
      // Secondary index: by reference (orderId) to find allocations easily
      if (movement.referenceId) {
          op.set(['tenants', tenantId, 'movements_by_ref', movement.referenceId, movement.id], movement);
      }
      await op.commit();
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

  const getByReference = async (tenantId, referenceId) => {
      return kvPool.withConnection(async (kv) => {
          const iter = kv.list({ prefix: ['tenants', tenantId, 'movements_by_ref', referenceId] });
          const movements = [];
          for await (const res of iter) {
              movements.push(res.value);
          }
          return movements;
      });
  };

  return { save, getByProduct, getByReference };
};
