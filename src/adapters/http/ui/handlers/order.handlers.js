import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { OrdersPage } from '../pages/ims/orders-page.jsx';
import { CreateOrderPage } from '../pages/ims/create-order-page.jsx';
import { OrderDetailPage } from '../pages/ims/order-detail-page.jsx';
import { PickListPage } from '../pages/ims/pick-list-page.jsx';
import { PackingSlipPage } from '../pages/ims/packing-slip-page.jsx';
import { CreateShipmentPage } from '../pages/ims/shipments/create-shipment-page.jsx';
import { unwrap, isErr, Ok } from '../../../../../lib/trust/index.js'; // 5 levels

// List Orders
export const listOrdersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');

    // Query Params
    const cursor = c.req.query('cursor');
    const status = c.req.query('status');
    const q = c.req.query('q');
    const minTotal = c.req.query('minTotal') ? parseFloat(c.req.query('minTotal')) : undefined;
    const maxTotal = c.req.query('maxTotal') ? parseFloat(c.req.query('maxTotal')) : undefined;
    const limit = 10;

    const res = await orders.useCases.listOrders.execute(tenantId, { limit, cursor, status, search: q, minTotal, maxTotal });
    const { items: orderList, nextCursor } = unwrap(res);

    const html = await renderPage(OrdersPage, {
      user,
      orders: orderList,
      nextCursor,
      currentUrl: c.req.url,
      query: q,
      layout: AdminLayout,
      title: 'Orders - IMS Admin'
    });

    return c.html(html);
};

// Create Order UI
export const createOrderPageHandler = async (c) => {
    try {
        const user = c.get('user');
        const tenantId = c.get('tenantId');
        const ac = c.ctx.get('domain.access-control');
        const catalog = c.ctx.get('domain.catalog');

        const userRes = await ac.useCases.listUsers.execute(tenantId, { limit: 100 });
        const prodRes = await catalog.useCases.listProducts.execute(tenantId, { limit: 100 });

        const allUsers = unwrap(userRes).items;
        const productsResult = unwrap(prodRes); // { items, nextCursor }
        const products = productsResult.items || [];

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
};

// Create Order POST
export const createOrderHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const body = await c.req.parseBody();

    const items = [];
    // Assuming body structure is correct
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

        unwrap(await orders.useCases.createOrder.execute(tenantId, body.userId, items));
        return c.redirect('/ims/orders');
    } catch (e) {
        const ac = c.ctx.get('domain.access-control');
        const catalog = c.ctx.get('domain.catalog');

        const userRes = await ac.useCases.listUsers.execute(tenantId, { limit: 100 });
        const prodRes = await catalog.useCases.listProducts.execute(tenantId, { limit: 100 });
        const allUsers = unwrap(userRes).items;
        const products = unwrap(prodRes).items || [];

        const html = await renderPage(CreateOrderPage, {
            user,
            customers: allUsers,
            products,
            activePage: 'orders',
            layout: AdminLayout,
            title: 'New Order - IMS Admin',
            error: e.message,
            values: { userId: body.userId, items }
        });
        return c.html(html, 400);
    }
};

// Create Shipment UI
export const createOrderShipmentPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const catalog = c.ctx.get('domain.catalog');

    const orderRes = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (isErr(orderRes)) return c.text('Order not found', 404);
    const order = orderRes.value;

    for (const item of order.items) {
        if (!item.productName) {
            const pRes = await catalog.useCases.getProduct.execute(tenantId, item.productId);
            const p = isErr(pRes) ? null : pRes.value;
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
};

export const createOrderShipmentHandler = async (c) => {
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
        unwrap(await orders.useCases.createShipment.execute(tenantId, {
            orderId,
            carrier: body.carrier,
            trackingNumber: body.trackingNumber,
            code: `SH-${Date.now()}`,
            items
        }));
        return c.redirect(`/ims/orders/${orderId}`);
    } catch (e) {
        const orderRes = await orders.useCases.getOrder.execute(tenantId, orderId);
        const order = isErr(orderRes) ? null : orderRes.value;

        const catalog = c.ctx.get('domain.catalog');
        if (order) {
             for (const item of order.items) {
                if (!item.productName) {
                    const pRes = await catalog.useCases.getProduct.execute(tenantId, item.productId);
                    const p = isErr(pRes) ? null : pRes.value;
                    item.productName = p ? p.name : 'Unknown Product';
                    item.sku = p ? p.sku : '';
                }
            }
        }

        const html = await renderPage(CreateShipmentPage, {
            user: c.get('user'),
            order,
            orderItems: order ? order.items : [],
            activePage: 'orders',
            layout: AdminLayout,
            title: 'New Shipment - IMS Admin',
            error: e.message
        });
        return c.html(html, 400);
    }
};

// Pick List
export const pickListHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const inventory = c.ctx.get('domain.inventory');
    const catalog = c.ctx.get('domain.catalog'); // Need direct catalog access for resolvers if inventory doesn't expose it

    const orderRes = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (isErr(orderRes)) return c.text('Order not found', 404);
    const order = orderRes.value;

    // Use unified query to fetch movements for this order and populate Product, Location, Batch
    // We can't access `stockMovementRepository` directly from here easily if it's not exposed in useCases?
    // Handler imports `inventory.repositories.stockMovement` in previous code.
    // Let's use `repo.query`.

    const resolvers = {
        product: (ids) => catalog.repositories.product.findByIds(tenantId, ids), // Assuming catalog repo exposed
        fromLocation: (ids) => inventory.repositories.location.findByIds(tenantId, ids),
        batch: (ids) => inventory.repositories.batch.findByIds(tenantId, ids)
    };

    // Note: 'product' field in StockMovement is 'productId'. The populator looks for 'productId' if 'product' is key.
    // Note: 'fromLocation' field. StockMovement has 'fromLocationId' (for allocation).
    // The previous code used `item.fromLocationId`.
    // The populator expects `fromLocation` -> `fromLocationId`.

    // Using direct repo call from handler is technically leaking "Infrastructure" details (repo.query) into "Interface Adapter" (Handler).
    // Ideally should be a use case `inventory.useCases.getPickingList(orderId)`.
    // But for this task, I will use `repo.query` directly as requested ("proper unified query layer which we can use on our list pages").

    const moveRes = await inventory.repositories.stockMovement.query(tenantId, {
        limit: 1000,
        filter: { reference: orderId, type: 'ALLOCATION' }, // type matches index? No index on type+reference composite.
        // Index on 'reference' exists. Index on 'type' exists.
        // `repo.query` will pick 'reference' index (more selective than type 'ALLOCATION').
        // Then filter by type in memory.
        populate: ['product', 'fromLocation', 'batch']
    }, { resolvers });

    const movements = unwrap(moveRes).items;

    const pickItems = movements.map(item => ({
        ...item,
        productName: item.product?.name || 'Unknown',
        sku: item.product?.sku || 'UNKNOWN',
        locationCode: item.fromLocation?.code || 'Unknown Loc',
        batchNumber: item.batch?.batchNumber,
        expiryDate: item.batch?.expiryDate
    }));

    pickItems.sort((a, b) => (a.locationCode || '').localeCompare(b.locationCode || ''));

    const html = await renderPage(PickListPage, {
        user,
        order,
        pickItems,
        layout: AdminLayout,
        title: `Pick List #${order.id} - IMS Admin`
    });
    return c.html(html);
};

// Packing Slip
export const packingSlipHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');

    const res = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (isErr(res)) return c.text('Order not found', 404);
    const order = res.value;

    const html = await renderPage(PackingSlipPage, {
        user,
        order,
        layout: AdminLayout,
        title: `Packing Slip #${order.id} - IMS Admin`
    });
    return c.html(html);
};

// Update Status
export const updateOrderStatusHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');
  const body = await c.req.parseBody();
  const status = body.status;

  try {
    unwrap(await orders.useCases.updateOrderStatus.execute(tenantId, orderId, status));
    return c.redirect(`/ims/orders/${orderId}`);
  } catch (e) {
    return c.text(`Error updating order: ${e.message}`, 400);
  }
};

// Order Detail
export const orderDetailHandler = async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');
  const catalog = c.ctx.get('domain.catalog');

  const res = await orders.useCases.getOrder.execute(tenantId, orderId);
  if (isErr(res)) return c.text('Order not found', 404);
  const order = res.value;

  // Enrich items with product details
  for (const item of order.items) {
      if (!item.productName) {
          const pRes = await catalog.useCases.getProduct.execute(tenantId, item.productId);
          const product = isErr(pRes) ? null : pRes.value;
          item.productName = product ? product.name : 'Unknown Product';
      }
  }

  // Fetch Shipments
  const shipRes = await orders.useCases.listShipments.execute(tenantId, { orderId });
  const { items: shipments } = unwrap(shipRes);

  const html = await renderPage(OrderDetailPage, {
    user,
    order,
    shipments,
    layout: AdminLayout,
    title: `Order #${order.id} - IMS Admin`
  });

  return c.html(html);
};
