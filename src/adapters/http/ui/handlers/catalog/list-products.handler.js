import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CatalogPage } from '../../pages/ims/catalog/catalog-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listProductsHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const cursor = c.req.query('cursor');
    const q = c.req.query('q');
    const categoryId = c.req.query('categoryId');
    const minPrice = c.req.query('minPrice') ? parseFloat(c.req.query('minPrice')) : undefined;
    const maxPrice = c.req.query('maxPrice') ? parseFloat(c.req.query('maxPrice')) : undefined;
    const status = c.req.query('status');

    const res = await catalog.useCases.listProducts.execute(tenantId, {
        limit: 50,
        cursor,
        search: q,
        categoryId,
        minPrice,
        maxPrice,
        status,
        populate: ['category']
    });

    const { items: products, nextCursor } = unwrap(res);

    const viewProducts = products.map(p => ({
        ...p,
        categoryName: p.category?.name || 'Uncategorized'
    }));

    const html = await renderPage(CatalogPage, {
        user,
        products: viewProducts,
        query: q,
        nextCursor,
        activePage: 'catalog',
        layout: AdminLayout,
        title: 'Catalog - IMS Admin'
    });
    return c.html(html);
};
