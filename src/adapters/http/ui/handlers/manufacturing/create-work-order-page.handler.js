import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateWorkOrderPage } from '../../pages/ims/manufacturing/create-wo-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createWorkOrderPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');

    const res = await manufacturing.useCases.listBOMs.execute(tenantId, { limit: 100 });
    const { items: boms } = unwrap(res);

    const html = await renderPage(CreateWorkOrderPage, {
        user,
        boms,
        activePage: 'work-orders',
        layout: AdminLayout,
        title: 'New Work Order - IMS Admin'
    });
    return c.html(html);
};
