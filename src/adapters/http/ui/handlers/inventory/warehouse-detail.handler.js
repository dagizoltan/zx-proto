import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { WarehouseDetailPage } from '../../pages/ims/inventory/warehouse-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const warehouseDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const wId = c.req.param('id');
    const inventory = c.ctx.get('domain.inventory');

    const wRes = await inventory.useCases.getWarehouse.execute(tenantId, wId);
    if (isErr(wRes)) return c.text('Warehouse not found', 404);
    const warehouse = wRes.value;

    const lRes = await inventory.useCases.listLocationsByWarehouse.execute(tenantId, wId, { limit: 1000 });
    const locations = unwrap(lRes).items;

    const html = await renderPage(WarehouseDetailPage, {
        user,
        warehouse,
        locations,
        activePage: 'warehouses',
        layout: AdminLayout,
        title: `${warehouse.name} - IMS Admin`
    });
    return c.html(html);
};
