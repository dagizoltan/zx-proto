import { unwrap } from '../../../../../../lib/trust/index.js';

export const createLocationHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const body = await c.req.parseBody();

    try {
        unwrap(await inventory.useCases.createLocation.execute(tenantId, {
            code: body.code,
            type: body.type,
            warehouseId: body.warehouseId,
            parentId: body.parentId || undefined
        }));
        return c.redirect('/ims/inventory/locations');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
