export const createReserveStock = ({ stockAllocationService }) => {
  const execute = async (tenantId, productId, quantity, orderId) => {
    await stockAllocationService.allocate(tenantId, productId, quantity, orderId);
    return true;
  };

  return { execute };
};
