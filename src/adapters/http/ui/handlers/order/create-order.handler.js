import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateOrderPage } from '../../pages/ims/create-order-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createOrderHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
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

    try {
        if (items.length === 0) throw new Error('No items selected');

        unwrap(await orders.useCases.createOrder.execute(tenantId, body.userId, items));
        return c.redirect('/ims/orders');
    } catch (e) {
        const ac = c.ctx.get('domain.access-control');
        const catalog = c.ctx.get('domain.catalog');

        const userRes = await ac.useCases.listUsers.execute(tenantId, { limit: 100 });
        const prodRes = await catalog.useCases.listProducts.execute(tenantId, { limit: 100 });
        const allUsers = unwrap(userRes).items;
        const products = unwrap(prodRes).items || [];

        const html = await renderPage(CreateOrderPage, {
            user,
            customers: allUsers,
            products,
            activePage: 'orders',
            layout: AdminLayout,
            title: 'New Order - IMS Admin',
            error: e.message,
            values: { userId: body.userId, items }
        });
        return c.html(html, 400);
    }
};
