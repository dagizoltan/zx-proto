import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { ProductsPage } from '../pages/products-page.jsx';

export const productsRoutes = new Hono();

productsRoutes.get('/', async (c) => {
  const catalog = c.ctx.get('domain.catalog');
  const cache = c.ctx.get('infra.persistence').cache;
  const user = c.get('user');
  const tenantId = c.get('tenantId');

  // Get query params
  const category = c.req.query('category');
  const search = c.req.query('search');
  const page = parseInt(c.req.query('page') || '1');

  // Try cache first
  const cacheKey = `${tenantId}:products:${category || 'all'}:${search || 'all'}:${page}`;
  let products = await cache.get(cacheKey);

  if (!products) {
    if (search) {
      products = await catalog.useCases.searchProducts.execute(tenantId, search, page);
    } else if (category) {
      products = await catalog.useCases.filterByCategory.execute(tenantId, category, page);
    } else {
      products = await catalog.useCases.listProducts.execute(tenantId, page);
    }

    await cache.set(cacheKey, products, 300000); // 5 minutes
  }

  const html = await renderPage(ProductsPage, {
    user,
    products,
    category,
    search,
    page,
    title: 'Products - IMS Shopfront'
  });

  return c.html(html);
});
