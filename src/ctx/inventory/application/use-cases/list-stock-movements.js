export const createListStockMovements = ({ stockMovementRepository }) => {
  const execute = async (tenantId, productId, { limit = 20, cursor } = {}) => {
    return await stockMovementRepository.getByProduct(tenantId, productId, { limit, cursor });
  };
  return { execute };
};
