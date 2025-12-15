import { unwrap } from '../../../../../../lib/trust/index.js';

export const createPurchaseOrderHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const body = await c.req.parseBody();

    const items = [];
    const itemKeys = Object.keys(body).filter(k => k.startsWith('items['));
    const indices = new Set(itemKeys.map(k => k.match(/items\[(\d+)\]/)[1]));

    for (const i of indices) {
        items.push({
            productId: body[`items[${i}][productId]`],
            quantity: parseInt(body[`items[${i}][quantity]`]),
            unitCost: parseFloat(body[`items[${i}][unitCost]`])
        });
    }

    try {
        unwrap(await procurement.useCases.createPurchaseOrder.execute(tenantId, {
            supplierId: body.supplierId,
            expectedDate: body.expectedDate ? new Date(body.expectedDate).toISOString() : undefined,
            items
        }));
        return c.redirect('/ims/procurement/purchase-orders');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
