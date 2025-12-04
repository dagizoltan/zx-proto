export const createGetProduct = ({ productRepository }) => {
  const execute = async (tenantId, id) => {
    return await productRepository.findById(tenantId, id);
  };

  return { execute };
};
