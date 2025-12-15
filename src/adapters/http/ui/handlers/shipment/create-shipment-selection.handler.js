import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { SelectOrderPage } from '../../pages/ims/shipments/select-order-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createShipmentSelectionHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const queries = c.ctx.get('domain.queries');

    const res = await orders.useCases.listOrders.execute(tenantId, { limit: 100 });
    const { items: allOrders } = unwrap(res);

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
