export const createListStockMovements = ({ stockMovementRepository }) => {
  const execute = async (tenantId, productId, { limit = 20, cursor } = {}) => {
    const result = await stockMovementRepository.getByProduct(tenantId, productId, { limit, cursor });

    // Fix #6: Removed in-memory sort.
    // Repository now returns items in correct order (Newest First) via time-ordered keys.

    return result;
  };
  return { execute };
};
