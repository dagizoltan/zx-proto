export const createConfirmStockShipment = ({ stockAllocationService }) => {
  const execute = async (tenantId, orderId, items = null, date) => {
    await stockAllocationService.commit(tenantId, orderId, items, date);
  };
  return { execute };
};
