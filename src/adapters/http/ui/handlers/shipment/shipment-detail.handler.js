import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { ShipmentDetailPage } from '../../pages/ims/shipments/shipment-detail-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const shipmentDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const shipmentId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const catalog = c.ctx.get('domain.catalog');

    const sRes = await orders.useCases.getShipment.execute(tenantId, shipmentId);

    let shipment;
    try {
        shipment = unwrap(sRes);
    } catch {
        return c.text('Shipment not found', 404);
    }

    if (!shipment) return c.text('Shipment not found', 404);

    const oRes = await orders.useCases.getOrder.execute(tenantId, shipment.orderId);
    let order = null;
    try {
        order = unwrap(oRes);
    } catch {}

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
