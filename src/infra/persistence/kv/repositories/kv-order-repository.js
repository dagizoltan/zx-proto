export const createKVOrderRepository = (kvPool) => {
  const save = async (order) => {
    return kvPool.withConnection(async (kv) => {
      // Index by ID and UserID
      const op = kv.atomic();
      op.set(['orders', order.id], order);
      op.set(['orders_by_user', order.userId, order.id], order.id);
      await op.commit();
      return order;
    });
  };

  const findById = async (id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['orders', id]);
      return res.value;
    });
  };

  const findByUserId = async (userId) => {
    return kvPool.withConnection(async (kv) => {
        const iter = kv.list({ prefix: ['orders_by_user', userId] });
        const orders = [];
        for await (const res of iter) {
            const orderId = res.value;
            const orderRes = await kv.get(['orders', orderId]);
            if (orderRes.value) orders.push(orderRes.value);
        }
        return orders;
    });
  }

  return { save, findById, findByUserId };
};
