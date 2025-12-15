import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CategoryDetailPage } from '../../pages/ims/catalog/category-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const categoryDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const categoryId = c.req.param('id');
    const catalog = c.ctx.get('domain.catalog');

    const catRes = await catalog.useCases.getCategory.execute(tenantId, categoryId);
    if (isErr(catRes)) return c.text('Category not found', 404);
    const category = catRes.value;

    const res = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });
    const { items: allCats } = unwrap(res);
    const subCategories = allCats.filter(cat => cat.parentId === categoryId);

    const html = await renderPage(CategoryDetailPage, {
        user,
        category,
        subCategories,
        activePage: 'categories',
        layout: AdminLayout,
        title: `${category.name} - IMS Admin`
    });
    return c.html(html);
};
