import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { WorkOrdersPage } from '../../pages/ims/manufacturing/work-orders-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listWorkOrdersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    const res = await manufacturing.useCases.listWorkOrders.execute(tenantId, {
        limit: 50,
        cursor,
        filter: { search: q },
        searchFields: ['code']
    });

    const { items: workOrders, nextCursor } = unwrap(res);

    const viewOrders = workOrders.map(wo => ({
        ...wo,
        productName: wo.bom ? 'Product from BOM ' + wo.bom.name : 'Unknown'
    }));

    const html = await renderPage(WorkOrdersPage, {
        user,
        workOrders: viewOrders,
        nextCursor,
        query: q,
        activePage: 'work-orders',
        layout: AdminLayout,
        title: 'Work Orders - IMS Admin'
    });
    return c.html(html);
};
