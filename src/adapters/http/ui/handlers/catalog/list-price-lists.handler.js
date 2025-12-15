import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { PriceListsPage } from '../../pages/ims/catalog/price-lists-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listPriceListsHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const cursor = c.req.query('cursor');

    const res = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 50, cursor });
    const { items: priceLists, nextCursor } = unwrap(res);

    const html = await renderPage(PriceListsPage, {
        user,
        priceLists,
        nextCursor,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: 'Price Lists - IMS Admin'
    });
    return c.html(html);
};
