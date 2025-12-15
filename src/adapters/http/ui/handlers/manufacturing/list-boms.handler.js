import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { BOMsPage } from '../../pages/ims/manufacturing/boms-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listBOMsHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    const res = await manufacturing.useCases.queryBOMs.execute(tenantId, {
        limit: 50,
        cursor,
        search: q
    });

    const { items: boms, nextCursor } = unwrap(res);

    const viewBoms = boms.map(bom => ({
        ...bom,
        productName: bom.product ? bom.product.name : 'Unknown Product'
    }));

    const html = await renderPage(BOMsPage, {
        user,
        boms: viewBoms,
        nextCursor,
        query: q,
        activePage: 'boms',
        layout: AdminLayout,
        title: 'Bill of Materials - IMS Admin'
    });
    return c.html(html);
};
