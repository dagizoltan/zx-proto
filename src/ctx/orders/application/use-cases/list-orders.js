import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createListOrders = ({ orderRepository, accessControl }) => {
  const execute = async (tenantId, { limit = 10, cursor, status, search, minTotal, maxTotal, customerId } = {}) => {

      const filter = {};
      if (status) filter.status = status; // Indexed
      if (customerId) filter.customer = customerId; // Indexed

      // Additional Filters
      if (search) filter.search = search; // Logic in repo.query (scan)
      if (minTotal !== undefined) filter.totalAmount_min = minTotal;
      if (maxTotal !== undefined) filter.totalAmount_max = maxTotal;

      // Orders don't have name/sku. They have ID and maybe customer name (if denormalized? usually not).
      // Search by ID and Customer ID.
      const searchFields = ['id', 'customerId'];

      return orderRepository.query(tenantId, { limit, cursor, filter, searchFields });
  };

  return { execute };
};
