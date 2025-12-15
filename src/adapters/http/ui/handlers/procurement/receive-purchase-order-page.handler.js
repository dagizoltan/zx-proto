import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { ReceivePurchaseOrderPage } from '../../pages/ims/procurement/receive-po-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const receivePurchaseOrderPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const poId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');
    const inventory = c.ctx.get('domain.inventory');
    const catalog = c.ctx.get('domain.catalog');

    const poRes = await procurement.useCases.getPurchaseOrder.execute(tenantId, poId);
    if (isErr(poRes)) return c.text('PO not found', 404);
    const po = poRes.value;

    const viewPo = { ...po };
    viewPo.items = po.items.map(item => ({ ...item }));

    const productIds = po.items.map(i => i.productId);
    const pRes = await catalog.useCases.getProductsBatch.execute(tenantId, productIds);
    if (!isErr(pRes)) {
        const pMap = new Map(pRes.value.map(p => [p.id, p]));
        for (const item of viewPo.items) {
             const product = pMap.get(item.productId);
             if (product) {
                 item.productName = product.name;
                 item.sku = product.sku;
             }
        }
    }

    const lRes = await inventory.useCases.listLocations.execute(tenantId, { limit: 1000 });
    const allLocations = unwrap(lRes).items;

    const html = await renderPage(ReceivePurchaseOrderPage, {
        user,
        po: viewPo,
        locations: allLocations,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: 'Receive PO - IMS Admin'
    });
    return c.html(html);
};
