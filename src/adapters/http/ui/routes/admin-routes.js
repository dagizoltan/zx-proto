import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { DashboardPage } from '../pages/admin/dashboard-page.jsx';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { authMiddleware } from '../middleware/auth-middleware.js';

import { catalogRoutes } from './admin/catalog-routes.js';
import { orderRoutes } from './admin/order-routes.js';
import { inventoryRoutes } from './admin/inventory-routes.js';
import { procurementRoutes } from './admin/procurement-routes.js';
import { manufacturingRoutes } from './admin/manufacturing-routes.js';
import { accessControlRoutes } from './admin/access-control-routes.js';
import { shipmentRoutes } from './admin/shipment-routes.js';

export const adminRoutes = new Hono();

// Protect all admin routes
adminRoutes.use('*', authMiddleware);

// Mount Sub-Routes
adminRoutes.route('/catalog', catalogRoutes);
adminRoutes.route('/orders', orderRoutes);
adminRoutes.route('/inventory', inventoryRoutes); // Also handles warehouses, locations
adminRoutes.route('/procurement', procurementRoutes); // Handles suppliers, POs
adminRoutes.route('/manufacturing', manufacturingRoutes); // Handles BOMs, WOs
adminRoutes.route('/shipments', shipmentRoutes); // Mounts at /admin/shipments
adminRoutes.route('/', accessControlRoutes); // Users, Roles, Customers are at root level /admin/users etc.

// Note: Inventory locations/warehouses were at /admin/warehouses.
// My sub-route mounts them at /admin/inventory/warehouses.
// To keep URLs clean or normalized, I should perhaps mount them differently or redirect.
// Original: /admin/warehouses
// New: /admin/inventory/warehouses
// User said "no need to be backward compatible". So this URL change is acceptable and cleaner.
// Exception: Access Control routes (users, roles) were at /admin/users.
// Mounting accessControlRoutes at '/' keeps them at /admin/users. Correct.

adminRoutes.get('/dashboard', async (c) => {
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

// Redirects for legacy mental models (Optional, but nice)
adminRoutes.get('/warehouses', (c) => c.redirect('/admin/inventory/warehouses'));
adminRoutes.get('/locations', (c) => c.redirect('/admin/inventory/locations'));
adminRoutes.get('/products', (c) => c.redirect('/admin/catalog')); // /admin/products -> /admin/catalog
adminRoutes.get('/products/new', (c) => c.redirect('/admin/catalog/products/new'));
adminRoutes.get('/boms', (c) => c.redirect('/admin/manufacturing/boms'));
adminRoutes.get('/work-orders', (c) => c.redirect('/admin/manufacturing/work-orders'));
adminRoutes.get('/suppliers', (c) => c.redirect('/admin/procurement/suppliers'));
adminRoutes.get('/purchase-orders', (c) => c.redirect('/admin/procurement/purchase-orders'));
