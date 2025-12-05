export const createConfirmStockShipment = ({ stockAllocationService }) => {
  const execute = async (tenantId, orderId, items = null) => {
    await stockAllocationService.commit(tenantId, orderId, items);
  };
  return { execute };
};
