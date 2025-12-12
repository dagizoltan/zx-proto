export const createListAllProducts = ({ productRepository }) => {
  const execute = async (tenantId, { limit = 10, cursor, status } = {}) => {
    return await productRepository.list(tenantId, { limit, cursor, where: status ? { status } : {} });
  };

  return { execute };
};
