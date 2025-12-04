export const createListStockMovements = ({ stockMovementRepository }) => {
  const execute = async (tenantId, productId) => {
    return await stockMovementRepository.getByProduct(tenantId, productId);
  };
  return { execute };
};
