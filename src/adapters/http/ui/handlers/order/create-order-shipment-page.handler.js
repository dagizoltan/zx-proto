import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateShipmentPage } from '../../pages/ims/shipments/create-shipment-page.jsx';
import { isErr } from '../../../../../../lib/trust/index.js';

export const createOrderShipmentPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const catalog = c.ctx.get('domain.catalog');

    const orderRes = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (isErr(orderRes)) return c.text('Order not found', 404);
    const order = orderRes.value;

    const productIdsToFetch = new Set();
    for (const item of order.items) {
        if (!item.productName) productIdsToFetch.add(item.productId);
    }

    if (productIdsToFetch.size > 0) {
        const productsRes = await catalog.useCases.getProductsBatch.execute(tenantId, Array.from(productIdsToFetch));
        if (!isErr(productsRes)) {
            const productMap = new Map(productsRes.value.map(p => [p.id, p]));
            for (const item of order.items) {
                if (!item.productName && productMap.has(item.productId)) {
                    const p = productMap.get(item.productId);
                    item.productName = p.name;
                    item.sku = p.sku;
                }
            }
        }
    }
    for (const item of order.items) {
         if (!item.productName) item.productName = 'Unknown Product';
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
