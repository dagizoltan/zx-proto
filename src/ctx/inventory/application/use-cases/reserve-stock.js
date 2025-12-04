export const createReserveStock = ({ stockAllocationService }) => {
  const execute = async (productId, quantity, orderId) => {
    await stockAllocationService.allocate(productId, quantity);
    // Could log reservation for orderId
    return true;
  };

  return { execute };
};
