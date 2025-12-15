import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { ShipmentsPage } from '../../pages/ims/shipments/shipments-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

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
