export const createCheckAvailability = ({ stockRepository, cache }) => {
  const execute = async (productId, quantity) => {
    // Ideally use cache, but for now direct lookup
    const current = await stockRepository.getStock(productId);
    return current >= quantity;
  };

  return { execute };
};
