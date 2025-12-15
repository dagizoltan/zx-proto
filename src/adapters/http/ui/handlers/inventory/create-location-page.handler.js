import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateLocationPage } from '../../pages/ims/inventory/create-location-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createLocationPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const wRes = await inventory.useCases.listWarehouses.execute(tenantId, { limit: 100 });
    const warehouses = unwrap(wRes).items;

    const lRes = await inventory.useCases.listLocations.execute(tenantId, { limit: 1000 });
    const allLocations = unwrap(lRes).items;

    const html = await renderPage(CreateLocationPage, {
        user,
        warehouses,
        locations: allLocations,
        activePage: 'locations',
        layout: AdminLayout,
        title: 'New Location - IMS Admin'
    });
    return c.html(html);
};
