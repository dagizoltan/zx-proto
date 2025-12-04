export const createConfirmStockShipment = ({ stockAllocationService }) => {
  const execute = async (tenantId, orderId) => {
    await stockAllocationService.commit(tenantId, orderId);
  };
  return { execute };
};
