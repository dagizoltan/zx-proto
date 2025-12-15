import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { WorkOrderDetailPage } from '../../pages/ims/manufacturing/wo-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const workOrderDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const woId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const catalog = c.ctx.get('domain.catalog');

    const woRes = await manufacturing.useCases.getWorkOrder.execute(tenantId, woId);
    if (isErr(woRes)) return c.text('Work Order not found', 404);
    const wo = woRes.value;

    const bRes = await manufacturing.useCases.getBOM.execute(tenantId, wo.bomId);
    const bom = isErr(bRes) ? null : bRes.value;

    if (bom) {
        const pRes = await catalog.useCases.getProduct.execute(tenantId, bom.productId);
        const product = isErr(pRes) ? null : pRes.value;
        wo.productName = product ? product.name : 'Unknown';
    } else {
        wo.productName = 'Unknown Product';
    }

    const html = await renderPage(WorkOrderDetailPage, {
        user,
        wo,
        bom,
        activePage: 'work-orders',
        layout: AdminLayout,
        title: `${wo.code} - IMS Admin`
    });
    return c.html(html);
};
