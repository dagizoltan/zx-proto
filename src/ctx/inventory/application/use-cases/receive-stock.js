export const createReceiveStock = ({ inventoryAdjustmentService }) => {
  const execute = async (tenantId, params) => {
    return await inventoryAdjustmentService.receiveStock(tenantId, params);
  };
  return { execute };
};
