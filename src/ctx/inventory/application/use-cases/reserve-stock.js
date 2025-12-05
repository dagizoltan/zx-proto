export const createReserveStock = ({ stockAllocationService }) => {
  const execute = async (tenantId, productId, quantity, orderId, date) => {
    await stockAllocationService.allocate(tenantId, productId, quantity, orderId, date);
    return true;
  };

  return { execute };
};
