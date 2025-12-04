// Service to handle complex allocation logic if needed
export const createStockAllocationService = (stockRepository) => {
  const allocate = async (tenantId, productId, amount) => {
    // This should ideally be atomic
    const current = await stockRepository.getStock(tenantId, productId);
    if (current < amount) {
      throw new Error('Insufficient stock');
    }
    await stockRepository.updateStock(tenantId, productId, current - amount);
  };

  return { allocate };
};
