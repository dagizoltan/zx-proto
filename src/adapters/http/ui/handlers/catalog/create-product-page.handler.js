import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateProductPage } from '../../pages/ims/catalog/create-product-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createProductPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const catRes = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });
    const plRes = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 1000 });

    const categories = unwrap(catRes).items;
    const priceLists = unwrap(plRes).items;

    const html = await renderPage(CreateProductPage, {
        user,
        categories,
        priceLists,
        activePage: 'catalog',
        layout: AdminLayout,
        title: 'Create Product - IMS Admin'
    });
    return c.html(html);
};
