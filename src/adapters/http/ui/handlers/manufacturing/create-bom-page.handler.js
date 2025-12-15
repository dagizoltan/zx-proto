import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateBOMPage } from '../../pages/ims/manufacturing/create-bom-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createBOMPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const res = await catalog.useCases.listProducts.execute(tenantId, { limit: 100 });
    const { items: products } = unwrap(res);

    const html = await renderPage(CreateBOMPage, {
        user,
        products,
        activePage: 'boms',
        layout: AdminLayout,
        title: 'New BOM - IMS Admin'
    });
    return c.html(html);
};
