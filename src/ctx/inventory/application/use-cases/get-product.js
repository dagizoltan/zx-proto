export const createGetProduct = ({ productRepository }) => {
  const execute = async (id) => {
    return await productRepository.findById(id);
  };

  return { execute };
};
