import { unwrap } from '../../../../../../lib/trust/index.js';

export const receivePurchaseOrderHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const poId = c.req.param('id');
    const procurement = c.ctx.get('domain.procurement');
    const body = await c.req.parseBody();

    const items = [];
    const indices = new Set(Object.keys(body).filter(k => k.startsWith('items[')).map(k => k.match(/items\[(\d+)\]/)[1]));

    for (const i of indices) {
        const qty = parseInt(body[`items[${i}][quantity]`]);
        if (qty > 0) {
            items.push({
                productId: body[`items[${i}][productId]`],
                quantity: qty
            });
        }
    }

    try {
        unwrap(await procurement.useCases.receivePurchaseOrder.execute(tenantId, poId, {
            locationId: body.locationId,
            items
        }));
        return c.redirect('/ims/procurement/purchase-orders');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
