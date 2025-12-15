import { unwrap } from '../../../../../../lib/trust/index.js';

export const receiveStockHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const body = await c.req.parseBody();

    try {
        unwrap(await inventory.useCases.receiveStockRobust.execute(tenantId, {
            productId: body.productId,
            locationId: body.locationId,
            quantity: parseInt(body.quantity),
            batchNumber: body.batchNumber,
            expiryDate: body.expiryDate ? new Date(body.expiryDate).toISOString() : undefined
        }));
        return c.redirect('/ims/inventory');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
