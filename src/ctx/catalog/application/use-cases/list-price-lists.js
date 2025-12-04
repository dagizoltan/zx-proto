export const createListPriceLists = ({ priceListRepository }) => {
  const execute = async (tenantId, params = {}) => {
    return priceListRepository.findAll(tenantId, params);
  };

  return { execute };
};
