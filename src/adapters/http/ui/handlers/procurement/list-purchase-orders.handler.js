import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { PurchaseOrdersPage } from '../../pages/ims/procurement/purchase-orders-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listPurchaseOrdersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    const res = await procurement.useCases.listPurchaseOrders.execute(tenantId, {
        limit: 50,
        cursor,
        filter: { search: q },
        searchFields: ['code', 'supplierId']
    });

    const { items: purchaseOrders, nextCursor } = unwrap(res);

    const viewPOs = purchaseOrders.map(po => ({
        ...po,
        supplierName: po.supplier?.name || 'Unknown'
    }));

    const html = await renderPage(PurchaseOrdersPage, {
        user,
        purchaseOrders: viewPOs,
        nextCursor,
        query: q,
        activePage: 'purchase-orders',
        layout: AdminLayout,
        title: 'Purchase Orders - IMS Admin'
    });
    return c.html(html);
};
