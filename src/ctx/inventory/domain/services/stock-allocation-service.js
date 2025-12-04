// Service to handle complex allocation logic if needed
export const createStockAllocationService = (stockRepository) => {
  const allocate = async (productId, amount) => {
    // This should ideally be atomic
    const current = await stockRepository.getStock(productId);
    if (current < amount) {
      throw new Error('Insufficient stock');
    }
    await stockRepository.updateStock(productId, current - amount);
  };

  return { allocate };
};
