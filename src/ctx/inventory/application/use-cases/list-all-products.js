export const createListAllProducts = ({ productRepository }) => {
  const execute = async (tenantId, { limit = 10, cursor } = {}) => {
    return await productRepository.findAll(tenantId, { limit, cursor });
  };

  return { execute };
};
