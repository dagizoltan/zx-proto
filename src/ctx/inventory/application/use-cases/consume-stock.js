export const createConsumeStock = ({ inventoryAdjustmentService }) => {
  const execute = async (tenantId, params) => {
    return await inventoryAdjustmentService.consumeStock(tenantId, params);
  };
  return { execute };
};
