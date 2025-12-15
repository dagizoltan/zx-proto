import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { OrdersPage } from '../../pages/ims/orders-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const listOrdersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');
    const accessControl = c.ctx.get('domain.access-control');

    const cursor = c.req.query('cursor');
    const status = c.req.query('status');
    const q = c.req.query('q');
    const minTotal = c.req.query('minTotal') ? parseFloat(c.req.query('minTotal')) : undefined;
    const maxTotal = c.req.query('maxTotal') ? parseFloat(c.req.query('maxTotal')) : undefined;
    const limit = 10;

    const res = await orders.useCases.listOrders.execute(tenantId, { limit, cursor, status, search: q, minTotal, maxTotal });
    const { items: orderList, nextCursor } = unwrap(res);

    if (orderList.length > 0) {
        const customerIds = new Set(orderList.map(o => o.customerId).filter(Boolean));
        if (customerIds.size > 0) {
             const usersRes = await accessControl.useCases.getUsersBatch.execute(tenantId, Array.from(customerIds));
             if (!isErr(usersRes)) {
                 const userMap = new Map(usersRes.value.map(u => [u.id, u]));
                 for (const order of orderList) {
                     if (order.customerId && userMap.has(order.customerId)) {
                         order.customerName = userMap.get(order.customerId).name;
                         order.customerEmail = userMap.get(order.customerId).email;
                     } else {
                         order.customerName = 'Unknown User';
                     }
                 }
             }
        }
    }

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
