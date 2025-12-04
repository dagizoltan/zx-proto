import { Hono } from 'hono';
import { renderPage } from '../renderer.js';
import { DashboardPage } from '../pages/admin/dashboard-page.jsx';
import { InventoryPage } from '../pages/admin/inventory-page.jsx';
import { OrderDetailPage } from '../pages/admin/order-detail-page.jsx';
import { ProductDetailPage } from '../pages/admin/product-detail-page.jsx';
import { OrdersPage } from '../pages/admin/orders-page.jsx';
import { UsersPage } from '../pages/admin/users-page.jsx';
import { RolesPage } from '../pages/admin/roles-page.jsx';
import { CustomersPage } from '../pages/admin/customers-page.jsx';
import { CustomerDetailPage } from '../pages/admin/customer-detail-page.jsx';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { authMiddleware } from '../middleware/auth-middleware.js';

export const adminRoutes = new Hono();

// Protect all admin routes
adminRoutes.use('*', authMiddleware);

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

adminRoutes.get('/inventory', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const inventory = c.ctx.get('domain.inventory');
  const cursor = c.req.query('cursor');
  const limit = 10;
  const { items: products, nextCursor } = await inventory.useCases.listAllProducts.execute(tenantId, { limit, cursor });

  const html = await renderPage(InventoryPage, {
    user,
    products,
    nextCursor,
    currentUrl: c.req.url,
    layout: AdminLayout,
    title: 'Inventory - IMS Admin'
  });

  return c.html(html);
});

adminRoutes.get('/orders', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const cursor = c.req.query('cursor');
    const limit = 10;
    const { items: orderList, nextCursor } = await orders.useCases.listOrders.execute(tenantId, { limit, cursor });

    const html = await renderPage(OrdersPage, {
      user,
      orders: orderList,
      nextCursor,
      currentUrl: c.req.url,
      layout: AdminLayout,
      title: 'Orders - IMS Admin'
    });

    return c.html(html);
});

adminRoutes.get('/products/:id', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const productId = c.req.param('id');
  const inventory = c.ctx.get('domain.inventory');
  const cursor = c.req.query('cursor');

  const product = await inventory.useCases.getProduct.execute(tenantId, productId);
  if (!product) return c.text('Product not found', 404);

  const [{ items: movements, nextCursor }, stockEntries] = await Promise.all([
    inventory.useCases.listStockMovements.execute(tenantId, productId, { limit: 20, cursor }),
    inventory.repositories.stock.getEntriesForProduct(tenantId, productId)
  ]);

  const currentStock = stockEntries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0);

  const html = await renderPage(ProductDetailPage, {
    user,
    product,
    movements,
    stock: currentStock,
    nextCursor,
    currentUrl: c.req.url,
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

// --- RBAC & CRM Pages (SSR Refactored) ---

adminRoutes.get('/users', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    // Fetch users and roles server-side
    const { items: users } = await ac.useCases.listUsers.execute(tenantId, { limit: 50 });
    const roles = await ac.useCases.listRoles.execute(tenantId);

    const html = await renderPage(UsersPage, {
        user,
        users,
        roles,
        layout: AdminLayout,
        title: 'Users & Roles - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.get('/roles', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    const roles = await ac.useCases.listRoles.execute(tenantId);

    const html = await renderPage(RolesPage, {
        user,
        roles,
        layout: AdminLayout,
        title: 'Roles - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.get('/customers', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    const { items: customers } = await ac.useCases.listUsers.execute(tenantId, { limit: 50 });

    const html = await renderPage(CustomersPage, {
        user,
        customers,
        layout: AdminLayout,
        title: 'Customers - IMS Admin'
    });
    return c.html(html);
});

adminRoutes.get('/customers/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const customerId = c.req.param('id');
    const ac = c.ctx.get('domain.access-control');

    try {
        const customerData = await ac.useCases.getCustomerProfile.execute(tenantId, customerId);
        const html = await renderPage(CustomerDetailPage, {
            user,
            customer: customerData, // Pass full data bundle
            layout: AdminLayout,
            title: 'Customer Details - IMS Admin'
        });
        return c.html(html);
    } catch (e) {
        return c.text(e.message, 404);
    }
});
