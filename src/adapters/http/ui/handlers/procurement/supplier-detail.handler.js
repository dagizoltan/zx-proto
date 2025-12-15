import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { SupplierDetailPage } from '../../pages/ims/procurement/supplier-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const supplierDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const supplierId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');

    const res = await procurement.useCases.getSupplier.execute(tenantId, supplierId);
    if (isErr(res)) return c.text('Supplier not found', 404);
    const supplier = res.value;

    const poRes = await procurement.useCases.queryPurchaseOrders.execute(tenantId, {
        limit: 100,
        filter: { supplier: supplierId }
    });
    const supplierPOs = unwrap(poRes).items;

    const html = await renderPage(SupplierDetailPage, {
        user,
        supplier,
        purchaseOrders: supplierPOs,
        activePage: 'suppliers',
        layout: AdminLayout,
        title: `${supplier.name} - IMS Admin`
    });
    return c.html(html);
};
