import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { ReceiveStockPage } from '../../pages/ims/inventory/receive-stock-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const receiveStockPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const pRes = await inventory.useCases.listAllProducts.execute(tenantId, { limit: 100 });
    const { items: products } = unwrap(pRes);

    const wRes = await inventory.useCases.listWarehouses.execute(tenantId, { limit: 100 });
    const warehouses = unwrap(wRes).items;

    const lRes = await inventory.useCases.listLocations.execute(tenantId, { limit: 1000 });
    const allLocations = unwrap(lRes).items;

    const html = await renderPage(ReceiveStockPage, {
        user,
        products,
        locations: allLocations,
        layout: AdminLayout,
        title: 'Receive Stock - IMS Admin'
    });
    return c.html(html);
};
