import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CustomersPage } from '../../pages/ims/customers-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listCustomersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    const rolesRes = await ac.useCases.listRoles.execute(tenantId);
    const roles = unwrap(rolesRes).items || unwrap(rolesRes);
    const customerRole = roles.find(r => r.name.toLowerCase() === 'customer');

    const filter = {};
    if (customerRole) {
        filter.role = customerRole.id;
    }
    if (q) {
        filter.search = q;
    }

    const res = await ac.useCases.queryUsers.execute(tenantId, {
        limit: 50,
        cursor,
        filter,
        searchFields: ['name', 'email']
    });

    const { items: customers, nextCursor } = unwrap(res);

    const html = await renderPage(CustomersPage, {
        user,
        customers,
        nextCursor,
        query: q,
        activePage: 'customers',
        layout: AdminLayout,
        title: 'Customers - IMS Admin'
    });
    return c.html(html);
};
