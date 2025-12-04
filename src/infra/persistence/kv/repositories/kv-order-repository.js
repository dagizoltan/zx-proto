export const createKVOrderRepository = (kvPool) => {
  const save = async (tenantId, order) => {
    return kvPool.withConnection(async (kv) => {
      // Index by ID and UserID
      const op = kv.atomic();
      op.set(['tenants', tenantId, 'orders', order.id], order);
      op.set(['tenants', tenantId, 'orders_by_user', order.userId, order.id], order.id);
      await op.commit();
      return order;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'orders', id]);
      return res.value;
    });
  };

  const findByUserId = async (tenantId, userId) => {
    return kvPool.withConnection(async (kv) => {
        const iter = kv.list({ prefix: ['tenants', tenantId, 'orders_by_user', userId] });
        const orders = [];
        for await (const res of iter) {
            const orderId = res.value;
            const orderRes = await kv.get(['tenants', tenantId, 'orders', orderId]);
            if (orderRes.value) orders.push(orderRes.value);
        }
        return orders;
    });
  }

  return { save, findById, findByUserId };
};
