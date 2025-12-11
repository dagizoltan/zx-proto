export const createReserveStock = ({ stockAllocationService }) => {
  const execute = async (tenantId, productId, quantity, orderId) => {
    return await stockAllocationService.allocate(tenantId, productId, quantity, orderId);
  };

  const executeBatch = async (tenantId, items, orderId) => {
    return await stockAllocationService.allocateBatch(tenantId, items, orderId);
  };

  return { execute, executeBatch };
};
