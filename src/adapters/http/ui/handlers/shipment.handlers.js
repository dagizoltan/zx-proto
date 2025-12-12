import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { ShipmentsPage } from '../pages/ims/shipments/shipments-page.jsx';
import { ShipmentDetailPage } from '../pages/ims/shipments/shipment-detail-page.jsx';
import { SelectOrderPage } from '../pages/ims/shipments/select-order-page.jsx';
import { unwrap } from '../../../../../lib/trust/index.js';

// New Shipment (Select Order)
export const createShipmentSelectionHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const queries = c.ctx.get('domain.queries');

    // Fetch orders that are PAID or PARTIALLY_SHIPPED
    // listOrders usually returns { items: [] } directly or Result?
    // Let's check listOrders. It is a legacy use case or new?
    // Assuming listOrders returns { items } directly based on previous code not crashing,
    // BUT we should be safe.

    // Actually, looking at orders.useCases.listOrders in src/ctx/orders/application/use-cases/list-orders.js
    // It returns repo.list(...) which returns a Result.
    // So this handler was likely broken too or getting lucky?
    // Let's wrap it in unwrap() to be consistent with inventory.
    const res = await orders.useCases.listOrders.execute(tenantId, { limit: 100 });
    const { items: allOrders } = unwrap(res);

    const shippableOrders = allOrders.filter(o => o.status === 'PAID' || o.status === 'PARTIALLY_SHIPPED');

    for (const o of shippableOrders) {
        if (o.userId) {
             try {
                // getCustomerProfile returns simple object (not Result) usually as it's a query service?
                // Queries often return plain data. Let's assume plain for queries.
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

    const res = await orders.useCases.listShipments.execute(tenantId, { limit: 20, cursor });
    const { items: shipments, nextCursor } = unwrap(res);

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

    // repo.findById returns Result
    const sRes = await orders.repositories.shipment.findById(tenantId, shipmentId);

    // Handle error manually or via try/catch unwrap
    let shipment;
    try {
        shipment = unwrap(sRes);
    } catch {
        return c.text('Shipment not found', 404);
    }

    if (!shipment) return c.text('Shipment not found', 404);

    // useCases.getOrder returns Result
    const oRes = await orders.useCases.getOrder.execute(tenantId, shipment.orderId);
    let order = null;
    try {
        order = unwrap(oRes);
    } catch {}

    // Enrich shipment items
    const enrichedItems = await Promise.all(shipment.items.map(async (item) => {
        let p = null;
        try {
            const pRes = await catalog.useCases.getProduct.execute(tenantId, item.productId);
            p = unwrap(pRes);
        } catch {}

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
