import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { StockMovementsPage } from '../../pages/ims/inventory/stock-movements-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listStockMovementsHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    const res = await inventory.useCases.queryStockMovements.execute(tenantId, {
        limit: 50,
        cursor,
        search: q
    });

    const { items: movements, nextCursor } = unwrap(res);

    const viewMovements = movements.map(m => ({
        ...m,
        productName: m.product?.name || 'Unknown',
        sku: m.product?.sku || '',
        locationCode: (m.location?.code || m.fromLocation?.code || m.toLocation?.code) || 'Transit',
        batchNumber: m.batch?.batchNumber
    }));

    const html = await renderPage(StockMovementsPage, {
        user,
        movements: viewMovements,
        nextCursor,
        query: q,
        currentUrl: c.req.url,
        layout: AdminLayout,
        title: 'Stock Movements - IMS Admin'
    });
    return c.html(html);
};
