import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateProductPage } from '../../pages/ims/catalog/create-product-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createProductHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const body = await c.req.parseBody();

    try {
        unwrap(await catalog.useCases.createProduct.execute(tenantId, {
            name: body.name,
            sku: body.sku,
            description: body.description,
            price: parseFloat(body.price),
            costPrice: body.costPrice ? parseFloat(body.costPrice) : undefined,
            categoryId: body.categoryId || undefined,
            type: body.type
        }));
        return c.redirect('/ims/catalog/products');
    } catch (e) {
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
            title: 'Create Product - IMS Admin',
            error: e.message,
            values: body
        });
        return c.html(html, 400);
    }
};
