export const createListPriceLists = ({ priceListRepository }) => {
  const execute = async (tenantId, params = {}) => {
    return priceListRepository.list(tenantId, params);
  };

  return { execute };
};
