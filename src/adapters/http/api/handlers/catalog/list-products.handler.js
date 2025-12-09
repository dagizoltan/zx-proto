import { toApiProductList } from '../../transformers/catalog.transformer.js';

export const listProductsHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const inventory = c.ctx.get('domain.inventory');
  const cache = c.ctx.get('infra.persistence').cache;

  // Use validated query from middleware
  const query = c.get('validatedQuery');

  // Construct cache key based on params
  // Use 'q' or 'search' for search term (handle both for compatibility)
  const searchTerm = query.q || query.search;

  const isFiltered = query.status || searchTerm || query.minPrice || query.maxPrice || query.cursor || query.category;

  if (!isFiltered) {
      const cached = await cache.get(`${tenantId}:products:all`);
      if (cached) {
        return c.json(cached);
      }
  }

  const result = await inventory.useCases.listAllProducts.execute(tenantId, {
      limit: query.limit,
      cursor: query.cursor,
      status: query.status,
      search: searchTerm,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      // category: query.category // The use case might not support category filtering yet, but we pass it
  });

  const response = toApiProductList(result);

  // Only cache default list
  if (!isFiltered) {
    await cache.set(`${tenantId}:products:all`, response, 300000);
  }

  return c.json(response);
};
