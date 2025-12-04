export const createListAllProducts = ({ productRepository }) => {
  const execute = async () => {
    return await productRepository.findAll();
  };

  return { execute };
};
