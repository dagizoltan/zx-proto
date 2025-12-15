import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { PickListPage } from '../../pages/ims/pick-list-page.jsx';
import { isErr } from '../../../../../../lib/trust/index.js';

export const pickListHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orderId = c.req.param('id');
    const orders = c.ctx.get('domain.orders');
    const inventory = c.ctx.get('domain.inventory');

    const orderRes = await orders.useCases.getOrder.execute(tenantId, orderId);
    if (isErr(orderRes)) return c.text('Order not found', 404);
    const order = orderRes.value;

    const pickRes = await inventory.useCases.getPickingList.execute(tenantId, orderId);
    if (isErr(pickRes)) return c.text('Error generating pick list: ' + pickRes.error.message, 500);

    const pickItems = pickRes.value;

    const html = await renderPage(PickListPage, {
        user,
        order,
        pickItems,
        layout: AdminLayout,
        title: `Pick List #${order.id} - IMS Admin`
    });
    return c.html(html);
};
