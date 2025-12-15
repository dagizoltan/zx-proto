import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateWorkOrderPage } from '../../pages/ims/manufacturing/create-wo-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createWorkOrderHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const body = await c.req.parseBody();

    try {
        unwrap(await manufacturing.useCases.createWorkOrder.execute(tenantId, {
            bomId: body.bomId,
            quantity: parseInt(body.quantity),
            startDate: body.startDate ? new Date(body.startDate).toISOString() : undefined,
            code: body.code || undefined
        }));
        return c.redirect('/ims/manufacturing/work-orders');
    } catch (e) {
        const res = await manufacturing.useCases.listBOMs.execute(tenantId, { limit: 100 });
        const { items: boms } = unwrap(res);

        const html = await renderPage(CreateWorkOrderPage, {
            user,
            boms,
            activePage: 'work-orders',
            layout: AdminLayout,
            title: 'New Work Order - IMS Admin',
            error: e.message,
            values: body
        });
        return c.html(html, 400);
    }
};
