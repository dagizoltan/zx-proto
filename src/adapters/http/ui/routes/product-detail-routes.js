import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { ProductDetailPage } from '../pages/product-detail-page.jsx';

export const productDetailRoutes = new Hono();

productDetailRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const inventory = c.ctx.get('domain.inventory');
  const user = c.get('user');

  const product = await inventory.useCases.getProduct.execute(id);

  if (!product) {
    return c.notFound();
  }

  // Get stock availability
  const availability = await inventory.useCases.checkAvailability.execute(id, 1);

  const html = await renderPage(ProductDetailPage, {
    user,
    product,
    available: availability,
    title: `${product.name} - IMS Shopfront`
  });

  return c.html(html);
});
