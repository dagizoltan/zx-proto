import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { SuppliersPage } from '../../pages/ims/procurement/suppliers-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listSuppliersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    const res = await procurement.useCases.listSuppliers.execute(tenantId, {
        limit: 50,
        cursor,
        filter: { search: q },
        searchFields: ['name', 'contactName', 'email']
    });
    const { items: suppliers, nextCursor } = unwrap(res);

    const html = await renderPage(SuppliersPage, {
        user,
        suppliers,
        nextCursor,
        query: q,
        activePage: 'suppliers',
        layout: AdminLayout,
        title: 'Suppliers - IMS Admin'
    });
    return c.html(html);
};
