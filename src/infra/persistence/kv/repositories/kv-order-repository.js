export const createKVOrderRepository = (kvPool) => {
  const save = async (tenantId, order) => {
    return kvPool.withConnection(async (kv) => {
      const op = kv.atomic();
      op.set(['tenants', tenantId, 'orders', order.id], order);
      op.set(['tenants', tenantId, 'orders_by_user', order.userId, order.id], order.id);
      // FIX #12: Add Status Index
      if (order.status) {
          op.set(['tenants', tenantId, 'orders_by_status', order.status, order.id], order.id);
      }
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
        const orderIds = [];
        for await (const res of iter) {
            orderIds.push(res.value);
        }

        if (orderIds.length === 0) return [];

        const keys = orderIds.map(id => ['tenants', tenantId, 'orders', id]);
        const results = await kv.getMany(keys);
        return results.map(r => r.value).filter(o => o !== null);
    });
  };

  const findAll = async (tenantId, { limit = 10, cursor, status, search, minTotal, maxTotal } = {}) => {
    return kvPool.withConnection(async (kv) => {
      // Optimization: Use Status Index if available and no text search (search requires full scan or search index)
      // If 'search' is present, we likely need to scan all orders unless we have a search index.
      // Prioritize Status Index if 'status' is set and 'search' is empty.

      let iter;
      let usingIndex = false;

      if (status && !search) {
          usingIndex = true;
          iter = kv.list({ prefix: ['tenants', tenantId, 'orders_by_status', status] }, { cursor, limit });
      } else {
          iter = kv.list({ prefix: ['tenants', tenantId, 'orders'] }, { cursor }); // Full scan if no index used
      }

      const orders = [];
      let nextCursor = null;
      let scannedCount = 0;

      // If using index, we get IDs. We need to fetch objects.
      // But we need to apply OTHER filters (minTotal, maxTotal) after fetching.
      // This makes pagination tricky if we filter out items.
      // The 'limit' in kv.list applies to the index entries.
      // If we fetch 10 IDs and filter out 5, we return 5.
      // The cursor still points to the 11th index entry. This is acceptable for cursor pagination.

      const tempIds = [];
      const indexItems = [];

      if (usingIndex) {
          // Collect IDs from index
           for await (const res of iter) {
               tempIds.push(res.value);
               indexItems.push(res); // Keep reference for cursor
               if (tempIds.length >= limit) break; // Fetch chunks?
               // Wait, if we filter post-fetch, we might return fewer than limit.
               // For strict pagination, we should loop until we fill 'orders' or exhaust iterator.
               // But 'kv.list' returns an iterator.
           }
           // For simple implementation, we just process the batch returned by iterator (which honors limit).
           // If fewer items match, the page is just shorter.

           if (tempIds.length > 0) {
               const keys = tempIds.map(id => ['tenants', tenantId, 'orders', id]);
               const results = await kv.getMany(keys);

               for (const res of results) {
                   if (res.value) orders.push(res.value);
               }
           }
           nextCursor = iter.cursor; // Cursor from the index iterator
      } else {
          // Full Scan Logic (original, but refined)
          const searchTerm = search ? search.toLowerCase() : null;

          for await (const res of iter) {
            const order = res.value;
            let match = true;

            if (status && order.status !== status) match = false;
            if (match && minTotal !== undefined && order.total < minTotal) match = false;
            if (match && maxTotal !== undefined && order.total > maxTotal) match = false;

            if (match && searchTerm) {
                const inId = order.id?.toLowerCase().includes(searchTerm);
                const inItems = order.items?.some(item =>
                    item.name?.toLowerCase().includes(searchTerm) ||
                    item.productId?.toLowerCase().includes(searchTerm)
                );
                if (!inId && !inItems) match = false;
            }

            if (match) {
              orders.push(order);
            }

            if (orders.length >= limit) {
              nextCursor = iter.cursor;
              break;
            }
          }
      }

      // If using index, we still need to filter by minTotal/maxTotal (post-fetch)
      if (usingIndex) {
          // Filter in place
          let i = orders.length;
          while (i--) {
              const order = orders[i];
              let match = true;
               if (minTotal !== undefined && order.total < minTotal) match = false;
               if (maxTotal !== undefined && order.total > maxTotal) match = false;

               if (!match) {
                   orders.splice(i, 1);
               }
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
