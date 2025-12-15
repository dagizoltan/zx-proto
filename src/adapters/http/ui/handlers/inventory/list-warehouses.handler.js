import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { WarehousesPage } from '../../pages/ims/inventory/warehouses-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listWarehousesHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const res = await inventory.useCases.listWarehouses.execute(tenantId, { limit: 100 });
    const warehouses = unwrap(res).items;

    const html = await renderPage(WarehousesPage, {
        user,
        warehouses,
        activePage: 'warehouses',
        layout: AdminLayout,
        title: 'Warehouses - IMS Admin'
    });
    return c.html(html);
};
