export const createCancelStockReservation = ({ stockAllocationService }) => {
  const execute = async (tenantId, orderId) => {
    await stockAllocationService.release(tenantId, orderId);
  };
  return { execute };
};
