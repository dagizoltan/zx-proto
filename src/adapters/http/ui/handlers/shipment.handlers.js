import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { ShipmentsPage } from '../pages/ims/shipments/shipments-page.jsx';
import { ShipmentDetailPage } from '../pages/ims/shipments/shipment-detail-page.jsx';
import { SelectOrderPage } from '../pages/ims/shipments/select-order-page.jsx';

// New Shipment (Select Order)
export const createShipmentSelectionHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const queries = c.ctx.get('domain.queries');

    // Fetch orders that are PAID or PARTIALLY_SHIPPED
    const { items: allOrders } = await orders.useCases.listOrders.execute(tenantId, { limit: 100 });
    const shippableOrders = allOrders.filter(o => o.status === 'PAID' || o.status === 'PARTIALLY_SHIPPED');

    for (const o of shippableOrders) {
        if (o.userId) {
             try {
                const result = await queries.useCases.getCustomerProfile.execute(tenantId, o.userId);
                o.customerName = result.user?.name || result.user?.email || 'Unknown';
             } catch (e) {
                o.customerName = 'Unknown';
             }
        }
    }

    const html = await renderPage(SelectOrderPage, {
        user,
        orders: shippableOrders,
        layout: AdminLayout,
        title: 'New Shipment - IMS Admin'
    });
    return c.html(html);
};

// List Shipments
export const listShipmentsHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const cursor = c.req.query('cursor');

    const { items: shipments, nextCursor } = await orders.useCases.listShipments.execute(tenantId, { limit: 20, cursor });

    const html = await renderPage(ShipmentsPage, {
        user,
        shipments,
        nextCursor,
        currentUrl: c.req.url,
        layout: AdminLayout,
        title: 'Shipments - IMS Admin'
    });
    return c.html(html);
};

// Shipment Detail
export const shipmentDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const shipmentId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const catalog = c.ctx.get('domain.catalog');

    const shipment = await orders.repositories.shipment.findById(tenantId, shipmentId);

    if (!shipment) return c.text('Shipment not found', 404);

    const order = await orders.useCases.getOrder.execute(tenantId, shipment.orderId);

    // Enrich shipment items
    const enrichedItems = await Promise.all(shipment.items.map(async (item) => {
        const p = await catalog.useCases.getProduct.execute(tenantId, item.productId).catch(() => null);
        return {
            ...item,
            productName: p ? p.name : 'Unknown',
            sku: p ? p.sku : ''
        };
    }));

    const html = await renderPage(ShipmentDetailPage, {
        user,
        shipment,
        items: enrichedItems,
        order,
        layout: AdminLayout,
        title: `Shipment ${shipment.code} - IMS Admin`
    });
    return c.html(html);
};
