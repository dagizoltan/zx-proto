import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { DashboardPage } from '../pages/ims/dashboard-page.jsx';
import { MePage } from '../pages/ims/me-page.jsx';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { authMiddleware } from '../middleware/auth-middleware.js';

import { catalogRoutes } from './ims/catalog-routes.js';
import { orderRoutes } from './ims/order-routes.js';
import { inventoryRoutes } from './ims/inventory-routes.js';
import { procurementRoutes } from './ims/procurement-routes.js';
import { manufacturingRoutes } from './ims/manufacturing-routes.js';
import { shipmentRoutes } from './ims/shipment-routes.js';
import { systemRoutes } from './ims/system-routes.js';
import { crmRoutes } from './ims/crm-routes.js';

export const imsRoutes = new Hono();

imsRoutes.use('*', authMiddleware);

imsRoutes.route('/catalog', catalogRoutes);
imsRoutes.route('/orders', orderRoutes);
imsRoutes.route('/inventory', inventoryRoutes); 
imsRoutes.route('/procurement', procurementRoutes);
imsRoutes.route('/manufacturing', manufacturingRoutes);
imsRoutes.route('/shipments', shipmentRoutes); 
imsRoutes.route('/system', systemRoutes);
imsRoutes.route('/crm', crmRoutes);

imsRoutes.get('/dashboard', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const orders = c.ctx.get('domain.orders');

  const stats = await orders.useCases.getDashboardStats.execute(tenantId);
  const { items: recentOrders } = await orders.useCases.listOrders.execute(tenantId, { limit: 5 });

  const html = await renderPage(DashboardPage, {
    user,
    stats,
    orders: recentOrders,
    layout: AdminLayout,
    title: 'Dashboard - IMS Admin'
  });

  return c.html(html);
});

imsRoutes.get('/me', async (c) => {
  const user = c.get('user');

  const html = await renderPage(MePage, {
    user,
    layout: AdminLayout,
    title: 'My Profile - IMS Admin'
  });

  return c.html(html);
});
