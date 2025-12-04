import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { DashboardPage } from '../pages/admin/dashboard-page.jsx';
import { InventoryPage } from '../pages/admin/inventory-page.jsx';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { authMiddleware } from '../middleware/auth-middleware.js';

export const adminRoutes = new Hono();

// Protect all admin routes
adminRoutes.use('*', authMiddleware);

adminRoutes.get('/dashboard', async (c) => {
  const user = c.get('user');
  const orders = c.ctx.get('domain.orders');

  // Get dashboard stats
  const stats = await orders.useCases.getDashboardStats.execute();

  const html = await renderPage(DashboardPage, {
    user,
    stats,
    layout: AdminLayout, // Use Admin Layout
    title: 'Dashboard - IMS Admin'
  });

  return c.html(html);
});

adminRoutes.get('/inventory', async (c) => {
  const user = c.get('user');
  const inventory = c.ctx.get('domain.inventory');

  const products = await inventory.useCases.listAllProducts.execute();

  const html = await renderPage(InventoryPage, {
    user,
    products,
    layout: AdminLayout,
    title: 'Inventory - IMS Admin'
  });

  return c.html(html);
});
