import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateShipmentPage } from '../../pages/ims/shipments/create-shipment-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

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

        if (order) {
            const catalog = c.ctx.get('domain.catalog');
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
