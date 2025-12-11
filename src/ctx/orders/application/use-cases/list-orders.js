import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createListOrders = ({ orderRepository }) => {
  const execute = async (tenantId, { limit = 10, cursor, status, search, minTotal, maxTotal } = {}) => {
      // orderRepository.list
      let where = {};
      if (status) where.status = status;

      const res = await orderRepository.list(tenantId, { limit: 1000, cursor, where }); // Scan 1000
      if (isErr(res)) return res;

      let items = res.value.items;

      // Manual Filter
      if (search || minTotal !== undefined || maxTotal !== undefined) {
          const lowerQ = search ? search.toLowerCase() : null;
          items = items.filter(o => {
              if (minTotal !== undefined && o.totalAmount < minTotal) return false;
              if (maxTotal !== undefined && o.totalAmount > maxTotal) return false;
              if (lowerQ) {
                  // Search by ID, Customer ID?
                  return o.id.toLowerCase().includes(lowerQ) || (o.customerId && o.customerId.toLowerCase().includes(lowerQ));
              }
              return true;
          });
      }

      const finalItems = items.slice(0, limit);

      return Ok({
          items: finalItems,
          nextCursor: finalItems.length < items.length ? null : res.value.nextCursor
      });
  };

  return { execute };
};
