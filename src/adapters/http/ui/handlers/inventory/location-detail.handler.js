import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { LocationDetailPage } from '../../pages/ims/inventory/location-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const locationDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const locId = c.req.param('id');
    const inventory = c.ctx.get('domain.inventory');

    const lRes = await inventory.useCases.getLocation.execute(tenantId, locId);
    if (isErr(lRes)) return c.text('Location not found', 404);
    const location = lRes.value;

    const wRes = await inventory.useCases.getWarehouse.execute(tenantId, location.warehouseId);
    const warehouse = isErr(wRes) ? null : wRes.value;

    let parent = null;
    if (location.parentId) {
        const pRes = await inventory.useCases.getLocation.execute(tenantId, location.parentId);
        parent = isErr(pRes) ? null : pRes.value;
    }

    const html = await renderPage(LocationDetailPage, {
        user,
        location,
        warehouse,
        parentLocation: parent,
        activePage: 'locations',
        layout: AdminLayout,
        title: `${location.code} - IMS Admin`
    });
    return c.html(html);
};
