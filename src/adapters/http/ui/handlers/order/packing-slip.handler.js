import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { PackingSlipPage } from '../../pages/ims/packing-slip-page.jsx';
import { isErr } from '../../../../../../lib/trust/index.js';

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
