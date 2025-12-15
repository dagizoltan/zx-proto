import { unwrap } from '../../../../../../lib/trust/index.js';

export const createWarehouseHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const body = await c.req.parseBody();

    try {
        unwrap(await inventory.useCases.createWarehouse.execute(tenantId, {
            name: body.name,
            code: body.code
        }));
        return c.redirect('/ims/inventory/warehouses');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
