import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateOrderPage } from '../../pages/ims/create-order-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createOrderPageHandler = async (c) => {
    try {
        const user = c.get('user');
        const tenantId = c.get('tenantId');
        const ac = c.ctx.get('domain.access-control');
        const catalog = c.ctx.get('domain.catalog');

        const userRes = await ac.useCases.listUsers.execute(tenantId, { limit: 100 });
        const prodRes = await catalog.useCases.listProducts.execute(tenantId, { limit: 100 });

        const allUsers = unwrap(userRes).items;
        const productsResult = unwrap(prodRes);
        const products = productsResult.items || [];

        const html = await renderPage(CreateOrderPage, {
            user,
            customers: allUsers,
            products,
            activePage: 'orders',
            layout: AdminLayout,
            title: 'New Order - IMS Admin'
        });
        return c.html(html);
    } catch (e) {
        return c.text('Error loading Create Order Page: ' + e.message + '\n' + e.stack, 500);
    }
};
