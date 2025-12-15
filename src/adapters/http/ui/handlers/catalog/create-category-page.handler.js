import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateCategoryPage } from '../../pages/ims/catalog/create-category-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createCategoryPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const res = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });
    const { items: categories } = unwrap(res);

    const html = await renderPage(CreateCategoryPage, {
        user,
        categories,
        activePage: 'categories',
        layout: AdminLayout,
        title: 'New Category - IMS Admin'
    });
    return c.html(html);
};
