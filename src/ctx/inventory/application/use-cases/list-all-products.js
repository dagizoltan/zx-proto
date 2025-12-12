export const createListAllProducts = ({ productRepository }) => {
  const execute = async (tenantId, { limit = 10, cursor, status, search, categoryId } = {}) => {

    const filter = {};
    if (status) filter.status = status;
    if (categoryId) filter.category = categoryId;
    if (search) filter.search = search;

    const searchFields = ['name', 'sku']; // Inventory view search fields

    return await productRepository.query(tenantId, { limit, cursor, filter, searchFields });
  };

  return { execute };
};
