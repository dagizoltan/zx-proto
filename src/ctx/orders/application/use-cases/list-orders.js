export const createListOrders = ({ orderRepository }) => {
  const execute = async (tenantId, { limit = 10, cursor, status, search, minTotal, maxTotal } = {}) => {
    return await orderRepository.findAll(tenantId, { limit, cursor, status, search, minTotal, maxTotal });
  };

  return { execute };
};
