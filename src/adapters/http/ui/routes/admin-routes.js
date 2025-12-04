import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { DashboardPage } from '../pages/admin/dashboard-page.jsx';
import { InventoryPage } from '../pages/admin/inventory-page.jsx';
import { OrderDetailPage } from '../pages/admin/order-detail-page.jsx';
import { ProductDetailPage } from '../pages/admin/product-detail-page.jsx';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { authMiddleware } from '../middleware/auth-middleware.js';

export const adminRoutes = new Hono();

// Protect all admin routes
adminRoutes.use('*', authMiddleware);

adminRoutes.get('/dashboard', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const orders = c.ctx.get('domain.orders');

  // Get dashboard stats
  const stats = await orders.useCases.getDashboardStats.execute(tenantId);
  // Get recent orders
  const recentOrders = await orders.useCases.listOrders.execute(tenantId);

  const html = await renderPage(DashboardPage, {
    user,
    stats,
    orders: recentOrders,
    layout: AdminLayout, // Use Admin Layout
    title: 'Dashboard - IMS Admin'
  });

  return c.html(html);
});

adminRoutes.get('/inventory', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const inventory = c.ctx.get('domain.inventory');

  const products = await inventory.useCases.listAllProducts.execute(tenantId);

  const html = await renderPage(InventoryPage, {
    user,
    products,
    layout: AdminLayout,
    title: 'Inventory - IMS Admin'
  });

  return c.html(html);
});

adminRoutes.get('/products/:id', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const productId = c.req.param('id');
  const inventory = c.ctx.get('domain.inventory');

  const product = await inventory.useCases.getProduct.execute(tenantId, productId);
  if (!product) return c.text('Product not found', 404);

  // Parallel fetch for details
  const [movements, stockEntries] = await Promise.all([
    inventory.useCases.listStockMovements.execute(tenantId, productId),
    inventory.repositories.stock.getEntriesForProduct(tenantId, productId) // Direct repo access for simplicity, or add a use case
  ]);

  // Aggregate stock
  const currentStock = stockEntries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0);

  const html = await renderPage(ProductDetailPage, {
    user,
    product,
    movements,
    stock: currentStock,
    layout: AdminLayout,
    title: `${product.name} - IMS Admin`
  });

  return c.html(html);
});

adminRoutes.get('/orders/:id', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');

  const order = await orders.useCases.getOrder.execute(tenantId, orderId);

  if (!order) return c.text('Order not found', 404);

  const html = await renderPage(OrderDetailPage, {
    user,
    order,
    layout: AdminLayout,
    title: `Order #${order.id} - IMS Admin`
  });

  return c.html(html);
});

adminRoutes.post('/orders/:id/status', async (c) => {
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');

  const body = await c.req.parseBody();
  const status = body.status;

  try {
    await orders.useCases.updateOrderStatus.execute(tenantId, orderId, status);
    return c.redirect(`/admin/orders/${orderId}`);
  } catch (e) {
    return c.text(`Error updating order: ${e.message}`, 400);
  }
});
