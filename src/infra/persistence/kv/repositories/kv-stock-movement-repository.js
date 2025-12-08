export const createKVStockMovementRepository = (kvPool) => {
  const save = async (tenantId, movement) => {
    return kvPool.withConnection(async (kv) => {
      const op = kv.atomic();
      // FIX #6: Time-ordered key for efficient pagination
      // Key: tenant -> movements -> productId -> timestamp_desc -> uuid
      const ts = new Date(movement.timestamp).getTime();
      const revTs = (Number.MAX_SAFE_INTEGER - ts).toString().padStart(20, '0');

      op.set(['tenants', tenantId, 'movements', movement.productId, revTs, movement.id], movement);

      // Secondary index: by reference (orderId)
      if (movement.referenceId) {
          op.set(['tenants', tenantId, 'movements_by_ref', movement.referenceId, movement.id], movement);
      }
      await op.commit();
      return movement;
    });
  };

  const getByProduct = async (tenantId, productId, { limit = 50, cursor } = {}) => {
    return kvPool.withConnection(async (kv) => {
      // Because we use inverted timestamp in the key, a forward scan yields Descending Time order (Newest First)
      const iter = kv.list(
          { prefix: ['tenants', tenantId, 'movements', productId] },
          { limit, cursor }
      );
      const movements = [];
      for await (const res of iter) {
        movements.push(res.value);
      }
      return {
          items: movements,
          nextCursor: iter.cursor
      };
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
