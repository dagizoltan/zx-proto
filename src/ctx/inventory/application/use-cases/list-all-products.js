export const createListAllProducts = ({ productRepository }) => {
  const execute = async (tenantId) => {
    return await productRepository.findAll(tenantId);
  };

  return { execute };
};
