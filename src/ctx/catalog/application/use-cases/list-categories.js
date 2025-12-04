export const createListCategories = ({ categoryRepository }) => {
  const execute = async (tenantId, params = {}) => {
    return categoryRepository.findAll(tenantId, params);
  };

  return { execute };
};
