import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { BOMDetailPage } from '../../pages/ims/manufacturing/bom-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const bomDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const bomId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');

    const res = await manufacturing.useCases.getBOM.execute(tenantId, bomId);
    if (isErr(res)) return c.text('BOM not found', 404);
    const bom = res.value;

    const pRes = await catalog.useCases.getProduct.execute(tenantId, bom.productId);
    const product = isErr(pRes) ? null : pRes.value;
    bom.productName = product ? product.name : 'Unknown';

    const compIds = bom.components.map(c => c.productId);
    const cRes = await catalog.useCases.getProductsBatch.execute(tenantId, compIds);
    if (!isErr(cRes)) {
        const pMap = new Map(cRes.value.map(p => [p.id, p]));
        for (const comp of bom.components) {
            const p = pMap.get(comp.productId);
            comp.productName = p ? p.name : 'Unknown';
            comp.sku = p ? p.sku : '';
        }
    }

    const html = await renderPage(BOMDetailPage, {
        user,
        bom,
        activePage: 'boms',
        layout: AdminLayout,
        title: `${bom.name} - IMS Admin`
    });
    return c.html(html);
};
