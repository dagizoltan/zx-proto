import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { LocationsPage } from '../../pages/ims/inventory/locations-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listLocationsHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const cursor = c.req.query('cursor');

    const wRes = await inventory.useCases.listWarehouses.execute(tenantId, { limit: 100 });
    const warehouses = unwrap(wRes).items;

    const lRes = await inventory.useCases.listLocations.execute(tenantId, {
        limit: 50,
        cursor,
        populate: ['warehouse']
    });

    const { items: locations, nextCursor } = unwrap(lRes);

    const html = await renderPage(LocationsPage, {
        user,
        locations,
        warehouses,
        nextCursor,
        activePage: 'locations',
        layout: AdminLayout,
        title: 'Locations - IMS Admin'
    });
    return c.html(html);
};
