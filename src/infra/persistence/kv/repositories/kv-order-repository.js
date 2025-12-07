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
      if (!tenantId || typeof tenantId !== 'string') throw new Error('Invalid tenantId in findById');
      if (!id || typeof id !== 'string') throw new Error('Invalid id in findById');
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
  };

  const findAll = async (tenantId, { limit = 10, cursor, status, search, minTotal, maxTotal } = {}) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'orders'] }, { cursor });
      const orders = [];
      let nextCursor = null;

      const searchTerm = search ? search.toLowerCase() : null;

      for await (const res of iter) {
        const order = res.value;
        let match = true;

        if (status && order.status !== status) {
          match = false;
        }

        if (match && minTotal !== undefined && order.total < minTotal) {
          match = false;
        }

        if (match && maxTotal !== undefined && order.total > maxTotal) {
          match = false;
        }

        if (match && searchTerm) {
            const inId = order.id?.toLowerCase().includes(searchTerm);
            // Search in items (optional, but good for "fuzzy search all data")
            const inItems = order.items?.some(item =>
                item.name?.toLowerCase().includes(searchTerm) ||
                item.productId?.toLowerCase().includes(searchTerm)
            );

            if (!inId && !inItems) {
                match = false;
            }
        }

        if (match) {
          orders.push(order);
        }

        if (orders.length >= limit) {
          nextCursor = iter.cursor;
          break;
        }
      }

      return {
          items: orders,
          nextCursor
      };
    });
  };

  return { save, findById, findByUserId, findAll };
};
