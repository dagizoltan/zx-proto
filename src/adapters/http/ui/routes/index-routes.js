import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { HomePage } from '../pages/home-page.jsx';

export const indexRoutes = new Hono();

indexRoutes.get('/', async (c) => {
  const catalog = c.ctx.get('domain.catalog');
  const user = c.get('user');
  const tenantId = c.get('tenantId');

  // Fetch featured products
  const featuredProducts = await catalog.useCases.getFeaturedProducts.execute(tenantId);

  const html = await renderPage(HomePage, {
    user,
    products: featuredProducts,
    title: 'Home - IMS Shopfront'
  });

  return c.html(html);
});
