import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { ProductDetailPage } from '../../pages/ims/product-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const productDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const productId = c.req.param('id');
    const inventory = c.ctx.get('domain.inventory');
    const catalog = c.ctx.get('domain.catalog');
    const cursor = c.req.query('cursor');

    const prodRes = await catalog.useCases.getProduct.execute(tenantId, productId);
    if (isErr(prodRes)) return c.text('Product not found', 404);
    const product = prodRes.value;

    const [moveRes, stockRes] = await Promise.all([
        inventory.useCases.listStockMovements.execute(tenantId, productId, { limit: 20, cursor }),
        inventory.useCases.getStockByProduct.execute(tenantId, productId, { limit: 1000 })
    ]);

    const moveData = unwrap(moveRes);
    const stockEntries = unwrap(stockRes).items;

    const currentStock = stockEntries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0);

    const html = await renderPage(ProductDetailPage, {
        user,
        product,
        movements: moveData.items,
        stock: currentStock,
        nextCursor: moveData.nextCursor,
        currentUrl: c.req.url,
        layout: AdminLayout,
        title: `${product.name} - IMS Admin`
    });

    return c.html(html);
};
