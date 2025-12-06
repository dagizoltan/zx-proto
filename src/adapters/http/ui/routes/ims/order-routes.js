import { Hono } from 'hono';
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { OrdersPage } from '../../pages/ims/orders-page.jsx';
import { CreateOrderPage } from '../../pages/ims/create-order-page.jsx';
import { OrderDetailPage } from '../../pages/ims/order-detail-page.jsx';
import { PickListPage } from '../../pages/ims/pick-list-page.jsx';
import { PackingSlipPage } from '../../pages/ims/packing-slip-page.jsx';
import { CreateShipmentPage } from '../../pages/ims/shipments/create-shipment-page.jsx';
import { ShipmentDetailPage } from '../../pages/ims/shipments/shipment-detail-page.jsx';
import { ShipmentsPage } from '../../pages/ims/shipments/shipments-page.jsx';

export const orderRoutes = new Hono();

// List Orders
orderRoutes.get('/', async (c) => {
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

// Create Order UI
orderRoutes.get('/new', async (c) => {
    try {
        const user = c.get('user');
        const tenantId = c.get('tenantId');
        const ac = c.ctx.get('domain.accessControl');
        const catalog = c.ctx.get('domain.catalog');

        const { items: allUsers } = await ac.useCases.listUsers.execute(tenantId, { limit: 100 });
        const productsResult = await catalog.useCases.listProducts.execute(tenantId, 1, 100);
        const products = Array.isArray(productsResult) ? productsResult : (productsResult.items || []);

        const html = await renderPage(CreateOrderPage, {
            user,
            customers: allUsers,
            products,
            activePage: 'orders',
            layout: AdminLayout,
            title: 'New Order - IMS Admin'
        });
        return c.html(html);
    } catch (e) {
        return c.text('Error loading Create Order Page: ' + e.message + '\n' + e.stack, 500);
    }
});

// Create Order POST
orderRoutes.post('/', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const body = await c.req.parseBody();

    const items = [];
    const indices = new Set(Object.keys(body).filter(k => k.startsWith('items[')).map(k => k.match(/items\[(\d+)\]/)[1]));

    for (const i of indices) {
        const qty = parseInt(body[`items[${i}][quantity]`]);
        if (qty > 0) {
            items.push({
                productId: body[`items[${i}][productId]`],
                quantity: qty
            });
        }
    }

    try {
        if (items.length === 0) throw new Error('No items selected');

        await orders.useCases.createOrder.execute(tenantId, body.userId, items);
        return c.redirect('/ims/orders');
    } catch (e) {
        const ac = c.ctx.get('domain.accessControl');
        const catalog = c.ctx.get('domain.catalog');

        const { items: allUsers } = await ac.useCases.listUsers.execute(tenantId, { limit: 100 });
        const productsResult = await catalog.useCases.listProducts.execute(tenantId, 1, 100);
        const products = Array.isArray(productsResult) ? productsResult : (productsResult.items || []);

        const html = await renderPage(CreateOrderPage, {
            user,
            customers: allUsers,
            products,
            activePage: 'orders',
            layout: AdminLayout,
            title: 'New Order - IMS Admin',
            error: e.message,
            values: { userId: body.userId, items } // Pass parsed items back? Or just raw body?
            // The CreateOrderPage script logic is complex. Re-populating dynamic rows via SSR requires care.
            // For now, simpler to just show error. Re-populating dynamic JS rows from SSR props needs updated component logic.
            // We will pass `previousItems` prop to component.
        });
        return c.html(html, 400);
    }
});

// Create Shipment UI (Linked from Order)
orderRoutes.get('/:id/shipments/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const catalog = c.ctx.get('domain.catalog');

    const order = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (!order) return c.text('Order not found', 404);

    for (const item of order.items) {
        if (!item.productName) {
            const p = await catalog.useCases.getProduct.execute(tenantId, item.productId).catch(() => null);
            item.productName = p ? p.name : 'Unknown Product';
            item.sku = p ? p.sku : '';
        }
    }

    const html = await renderPage(CreateShipmentPage, {
        user,
        order,
        orderItems: order.items,
        activePage: 'orders',
        layout: AdminLayout,
        title: 'New Shipment - IMS Admin'
    });
    return c.html(html);
});

orderRoutes.post('/:id/shipments', async (c) => {
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const body = await c.req.parseBody();

    const items = [];
    const indices = new Set(Object.keys(body).filter(k => k.startsWith('items[')).map(k => k.match(/items\[(\d+)\]/)[1]));

    for (const i of indices) {
        const qty = parseInt(body[`items[${i}][quantity]`]);
        if (qty > 0) {
            items.push({
                productId: body[`items[${i}][productId]`],
                quantity: qty
            });
        }
    }

    if (items.length === 0) return c.text('No items selected for shipment', 400);

    try {
        await orders.useCases.createShipment.execute(tenantId, {
            orderId,
            carrier: body.carrier,
            trackingNumber: body.trackingNumber,
            code: `SH-${Date.now()}`,
            items
        });
        return c.redirect(`/ims/orders/${orderId}`);
    } catch (e) {
        return c.text(e.message, 400);
    }
});

// Pick List
orderRoutes.get('/:id/pick-list', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const inventory = c.ctx.get('domain.inventory');

    const order = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (!order) return c.text('Order not found', 404);

    const movements = await inventory.repositories.stockMovement.getByReference(tenantId, orderId);
    const allocated = movements.filter(m => m.type === 'allocated');

    const pickItems = await Promise.all(allocated.map(async (item) => {
        const [product, location, batch] = await Promise.all([
            inventory.useCases.getProduct.execute(tenantId, item.productId),
            inventory.repositories.location.findById(tenantId, item.fromLocationId),
            item.batchId ? inventory.repositories.batch.findById(tenantId, item.batchId) : null
        ]);
        return {
            ...item,
            productName: product?.name || 'Unknown',
            sku: product?.sku || 'UNKNOWN',
            locationCode: location?.code || 'Unknown Loc',
            batchNumber: batch?.batchNumber,
            expiryDate: batch?.expiryDate
        };
    }));

    pickItems.sort((a, b) => a.locationCode.localeCompare(b.locationCode));

    const html = await renderPage(PickListPage, {
        user,
        order,
        pickItems,
        layout: AdminLayout,
        title: `Pick List #${order.id} - IMS Admin`
    });
    return c.html(html);
});

// Packing Slip
orderRoutes.get('/:id/packing-slip', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');

    const order = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (!order) return c.text('Order not found', 404);

    const html = await renderPage(PackingSlipPage, {
        user,
        order,
        layout: AdminLayout,
        title: `Packing Slip #${order.id} - IMS Admin`
    });
    return c.html(html);
});

// Update Status
orderRoutes.post('/:id/status', async (c) => {
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');
  const body = await c.req.parseBody();
  const status = body.status;

  try {
    await orders.useCases.updateOrderStatus.execute(tenantId, orderId, status);
    return c.redirect(`/ims/orders/${orderId}`);
  } catch (e) {
    return c.text(`Error updating order: ${e.message}`, 400);
  }
});

// Order Detail
orderRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');
  const catalog = c.ctx.get('domain.catalog');

  const order = await orders.useCases.getOrder.execute(tenantId, orderId);
  if (!order) return c.text('Order not found', 404);

  // Enrich items with product details
  for (const item of order.items) {
      if (!item.productName) {
          const product = await catalog.useCases.getProduct.execute(tenantId, item.productId).catch(() => null);
          item.productName = product ? product.name : 'Unknown Product';
      }
  }

  // Fetch Shipments
  const { items: shipments } = await orders.useCases.listShipments.execute(tenantId, { orderId });

  const html = await renderPage(OrderDetailPage, {
    user,
    order,
    shipments,
    layout: AdminLayout,
    title: `Order #${order.id} - IMS Admin`
  });

  return c.html(html);
});
