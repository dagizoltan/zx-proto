import { toApiProductList } from '../../transformers/catalog.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listProductsHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const catalog = c.ctx.get('domain.catalog'); // Switch to Catalog
  const cache = c.ctx.get('infra.persistence').cache;

  const query = c.get('validatedQuery');
  const searchTerm = query.q || query.search;

  const isFiltered = query.status || searchTerm || query.minPrice || query.maxPrice || query.cursor || query.category;
  const cacheKey = `${tenantId}:products:all:${query.limit}`;

  if (!isFiltered) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return c.json(cached);
      }
  }

  // Use Catalog UseCase
  // Note: Catalog Use Case 'listProducts' (from createListProducts) takes (tenantId, page, limit).
  // BUT the generic list usually takes cursors.
  // My refactor of `catalog-use-cases.js` for `createListProducts` was:
  // execute: async (tenantId, page = 1, limit = 20) => ...
  // This breaks cursor pagination support in Handler!

  // I should use `listAllProducts` equivalent in Catalog that supports cursors?
  // `createListProducts` in `catalog-use-cases.js` was using `items.slice`! That was bad for Rebase.
  // I should fix `catalog-use-cases.js` to support cursors properly like `listAllProducts` did.

  // Let's call catalog.useCases.listProducts but FIX it first.

  const result = unwrap(await catalog.useCases.listProducts.execute(tenantId, {
      limit: query.limit,
      cursor: query.cursor,
      status: query.status, // Not supported by Repo.list unless 'where' match
      search: searchTerm,   // Not supported by Repo.list directly yet (manual filter needed)
      // minPrice, maxPrice...
  }));

  // Wait, `listProducts` signature in `catalog-use-cases.js` is `(tenantId, page, limit)`.
  // I must update `catalog-use-cases.js` to accept object params `(tenantId, { limit, cursor, ... })`.

  const response = toApiProductList(result);

  if (!isFiltered) {
    await cache.set(cacheKey, response, 300000);
  }

  return c.json(response);
};
