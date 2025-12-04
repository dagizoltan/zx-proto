export const createCheckAvailability = ({ stockRepository, cache }) => {
  const execute = async (tenantId, productId, quantity) => {
    // Ideally use cache, but for now direct lookup
    const current = await stockRepository.getStock(tenantId, productId);
    return current >= quantity;
  };

  return { execute };
};
