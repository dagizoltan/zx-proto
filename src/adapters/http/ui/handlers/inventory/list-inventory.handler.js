import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { InventoryPage } from '../../pages/ims/inventory-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listInventoryHandler = async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const inventory = c.ctx.get('domain.inventory');

  const cursor = c.req.query('cursor');
  const q = c.req.query('q');
  const categoryId = c.req.query('categoryId');
  const status = c.req.query('status');

  const limit = 10;
  const res = await inventory.useCases.listAllProducts.execute(tenantId, { limit, cursor, search: q, categoryId, status });
  const { items: products, nextCursor } = unwrap(res);

  const html = await renderPage(InventoryPage, {
    user,
    products,
    nextCursor,
    query: q,
    currentUrl: c.req.url,
    layout: AdminLayout,
    title: 'Inventory - IMS Admin'
  });

  return c.html(html);
};
