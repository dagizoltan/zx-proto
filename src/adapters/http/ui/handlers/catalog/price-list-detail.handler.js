import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { PriceListDetailPage } from '../../pages/ims/catalog/price-list-detail-page.jsx';
import { isErr } from '../../../../../../lib/trust/index.js';

export const priceListDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const plId = c.req.param('id');
    const catalog = c.ctx.get('domain.catalog');

    const res = await catalog.useCases.getPriceList.execute(tenantId, plId);
    if (isErr(res)) return c.text('Price List not found', 404);
    const priceList = res.value;

    const html = await renderPage(PriceListDetailPage, {
        user,
        priceList,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: `${priceList.name} - IMS Admin`
    });
    return c.html(html);
};
