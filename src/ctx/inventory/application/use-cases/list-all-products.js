export const createListAllProducts = ({ productRepository }) => {
  const execute = async (tenantId, { limit = 10, cursor, status, search, minPrice, maxPrice } = {}) => {
    return await productRepository.findAll(tenantId, { limit, cursor, status, search, minPrice, maxPrice });
  };

  return { execute };
};
