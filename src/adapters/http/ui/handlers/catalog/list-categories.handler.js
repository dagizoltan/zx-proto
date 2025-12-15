import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CategoriesPage } from '../../pages/ims/catalog/categories-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listCategoriesHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const cursor = c.req.query('cursor');

    const res = await catalog.useCases.listCategories.execute(tenantId, { limit: 50, cursor });
    const { items: categories, nextCursor } = unwrap(res);

    const html = await renderPage(CategoriesPage, {
        user,
        categories,
        nextCursor,
        activePage: 'categories',
        layout: AdminLayout,
        title: 'Categories - IMS Admin'
    });
    return c.html(html);
};
