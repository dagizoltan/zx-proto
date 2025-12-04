import { Hono } from 'hono';

export const productRoutes = new Hono();

productRoutes.get('/', async (c) => {
  const catalog = c.ctx.get('domain.catalog');
  const cache = c.ctx.get('infra.persistence').cache;
  const tenantId = c.get('tenantId');

  // Try cache first
  const cached = await cache.get(`${tenantId}:products:all`);
  if (cached) {
    return c.json(cached);
  }

  const products = await catalog.useCases.listProducts.execute(tenantId);

  // Cache for 5 minutes
  await cache.set(`${tenantId}:products:all`, products, 300000);

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

    try {
      const product = await inventory.useCases.createProduct.execute(tenantId, data);

      await obs.audit('Product created', {
        tenantId,
        productId: product.id,
        sku: product.sku,
      });

      return c.json(product, 201);
    } catch (error) {
      return c.json({ error: error.message }, 400);
    }
});
