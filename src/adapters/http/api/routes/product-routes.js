import { Hono } from 'hono';

export const productRoutes = new Hono();

productRoutes.get('/', async (c) => {
  const catalog = c.ctx.get('domain.catalog');
  const cache = c.ctx.get('infra.persistence').cache;

  // Try cache first
  const cached = await cache.get('products:all');
  if (cached) {
    return c.json(cached);
  }

  const products = await catalog.useCases.listProducts.execute();

  // Cache for 5 minutes
  await cache.set('products:all', products, 300000);

  return c.json(products);
});

productRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const inventory = c.ctx.get('domain.inventory');

  const product = await inventory.useCases.getProduct.execute(id);

  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }

  return c.json(product);
});

productRoutes.post('/', async (c) => {
    // Basic protection (should use middleware)
    // const user = c.get('user'); ...

    const data = await c.req.json();
    const inventory = c.ctx.get('domain.inventory');
    const obs = c.ctx.get('infra.obs');

    try {
      const product = await inventory.useCases.createProduct.execute(data);

      await obs.audit('Product created', {
        productId: product.id,
        sku: product.sku,
      });

      return c.json(product, 201);
    } catch (error) {
      return c.json({ error: error.message }, 400);
    }
});
