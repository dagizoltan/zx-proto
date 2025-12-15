import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreatePurchaseOrderPage } from '../../pages/ims/procurement/create-po-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createPurchaseOrderPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const catalog = c.ctx.get('domain.catalog');

    const sRes = await procurement.useCases.listSuppliers.execute(tenantId, { limit: 1000 });
    const pRes = await catalog.useCases.listProducts.execute(tenantId, { limit: 1000 });
    const { items: suppliers } = unwrap(sRes);
    const { items: products } = unwrap(pRes);

    const html = await renderPage(CreatePurchaseOrderPage, {
        user,
        suppliers,
        products,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: 'New Purchase Order - IMS Admin'
    });
    return c.html(html);
};
