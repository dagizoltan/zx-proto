import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CompleteWorkOrderPage } from '../../pages/ims/manufacturing/complete-wo-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const completeWorkOrderHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const woId = c.req.param('id');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const body = await c.req.parseBody();

    if (body.locationId) {
        try {
            await manufacturing.useCases.completeWorkOrder.execute(tenantId, woId, {
                locationId: body.locationId,
                inputLocationId: body.inputLocationId || undefined
            });
            return c.redirect('/ims/manufacturing/work-orders');
        } catch (e) {
            return c.text(e.message, 400);
        }
    } else {
        const user = c.get('user');
        const inventory = c.ctx.get('domain.inventory');
        const woRes = await manufacturing.useCases.getWorkOrder.execute(tenantId, woId);
        if (isErr(woRes)) return c.text('WO not found', 404);
        const wo = woRes.value;

        const bRes = await manufacturing.useCases.getBOM.execute(tenantId, wo.bomId);
        const bom = isErr(bRes) ? null : bRes.value;
        wo.productName = 'Product from ' + (bom ? bom.name : 'Unknown BOM');

        const wRes = await inventory.useCases.listWarehouses.execute(tenantId, { limit: 100 });
        const warehouses = unwrap(wRes).items;

        const lRes = await inventory.useCases.listLocations.execute(tenantId, { limit: 1000 });
        const allLocations = unwrap(lRes).items;

        const html = await renderPage(CompleteWorkOrderPage, {
            user,
            wo,
            locations: allLocations,
            activePage: 'work-orders',
            layout: AdminLayout,
            title: 'Complete Work Order - IMS Admin'
        });
        return c.html(html);
    }
};
