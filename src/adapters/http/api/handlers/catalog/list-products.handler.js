import { toApiProductList } from '../../transformers/catalog.transformer.js';

export const listProductsHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const inventory = c.ctx.get('domain.inventory');
  const cache = c.ctx.get('infra.persistence').cache;

  // Use validated query from middleware
  const query = c.get('validatedQuery');

  // Construct search term
  const searchTerm = query.q || query.search;

  // Cache only if no filters and no cursor (first page)
  const isFiltered = query.status || searchTerm || query.minPrice || query.maxPrice || query.cursor || query.category;

  // Include limit in cache key to prevent serving wrong page size
  const cacheKey = `${tenantId}:products:all:${query.limit}`;

  if (!isFiltered) {
      const cached = await cache.get(cacheKey);
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
  });

  const response = toApiProductList(result);

  // Only cache default list
  if (!isFiltered) {
    await cache.set(cacheKey, response, 300000); // 5 mins
  }

  return c.json(response);
};
