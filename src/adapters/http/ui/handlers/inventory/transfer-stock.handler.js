import { unwrap } from '../../../../../../lib/trust/index.js';

export const transferStockHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const body = await c.req.parseBody();

    try {
        unwrap(await inventory.useCases.moveStock.execute(tenantId, {
            productId: body.productId,
            fromLocationId: body.fromLocationId,
            toLocationId: body.toLocationId,
            quantity: parseInt(body.quantity),
            reason: body.reason
        }));
        return c.redirect('/ims/inventory');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
