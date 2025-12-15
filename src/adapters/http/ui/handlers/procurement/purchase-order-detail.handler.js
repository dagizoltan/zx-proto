import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { PurchaseOrderDetailPage } from '../../pages/ims/procurement/po-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const purchaseOrderDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const poId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');
    const catalog = c.ctx.get('domain.catalog');

    const poRes = await procurement.useCases.getPurchaseOrder.execute(tenantId, poId);
    if (isErr(poRes)) return c.text('PO not found', 404);
    const po = poRes.value;

    const viewPo = { ...po };

    const productIds = po.items.map(i => i.productId);
    const pRes = await catalog.useCases.getProductsBatch.execute(tenantId, productIds);

    viewPo.items = po.items.map(item => ({ ...item }));

    if (!isErr(pRes)) {
        const pMap = new Map(pRes.value.map(p => [p.id, p]));
        for (const item of viewPo.items) {
            const product = pMap.get(item.productId);
            item.productName = product ? product.name : 'Unknown';
            item.sku = product ? product.sku : '';
        }
    }

    const sRes = await procurement.useCases.getSupplier.execute(tenantId, po.supplierId);
    const supplier = isErr(sRes) ? null : sRes.value;
    viewPo.supplierName = supplier ? supplier.name : 'Unknown';

    const html = await renderPage(PurchaseOrderDetailPage, {
        user,
        po: viewPo,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: `PO ${po.code} - IMS Admin`
    });
    return c.html(html);
};
