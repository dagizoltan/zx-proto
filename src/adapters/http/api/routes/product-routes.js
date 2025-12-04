import { Hono } from 'hono';

export const productRoutes = new Hono();

productRoutes.get('/', async (c) => {
  // Use inventory domain for listing with filters, not catalog for now as per plan
  const inventory = c.ctx.get('domain.inventory');
  const cache = c.ctx.get('infra.persistence').cache;
  const tenantId = c.get('tenantId');

  // Parse query params
  const { limit, cursor, status, q: search, minPrice, maxPrice } = c.req.query();

  // Construct cache key based on params to avoid stale cache on filtered searches
  // (Simple caching might not be suitable for search, disabling cache for search/filter for now)
  const isFiltered = status || search || minPrice || maxPrice || cursor;

  if (!isFiltered) {
      const cached = await cache.get(`${tenantId}:products:all`);
      if (cached) {
        return c.json(cached);
      }
  }

  const products = await inventory.useCases.listAllProducts.execute(tenantId, {
      limit: limit ? parseInt(limit) : 10,
      cursor,
      status,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
  });

  // Only cache default list
  if (!isFiltered) {
    await cache.set(`${tenantId}:products:all`, products, 300000);
  }

  return c.json(products);
});

productRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const tenantId = c.get('tenantId');
  const inventory = c.ctx.get('domain.inventory');

  const product = await inventory.useCases.getProduct.execute(tenantId, id);

  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }

  return c.json(product);
});

productRoutes.post('/', async (c) => {
    // Basic protection (should use middleware)
    // const user = c.get('user'); ...

    const data = await c.req.json();
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const obs = c.ctx.get('infra.obs');

    // Validation is handled in the use case now
    const product = await inventory.useCases.createProduct.execute(tenantId, data);

    await obs.audit('Product created', {
      tenantId,
      productId: product.id,
      sku: product.sku,
    });

    return c.json(product, 201);
});
