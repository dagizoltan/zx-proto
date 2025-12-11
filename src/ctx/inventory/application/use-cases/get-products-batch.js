// repo.findByIds returns Result<Array>
export const createGetProductsBatch = ({ productRepository }) => {
  const execute = async (tenantId, productIds) => {
    return await productRepository.findByIds(tenantId, productIds);
  };
  return { execute };
};
