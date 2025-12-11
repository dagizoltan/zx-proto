// Placeholder for stock operations
import { unwrap } from '../../../../../../lib/trust/index.js';

export const receiveStockHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const data = c.get('validatedData');

    const result = unwrap(await inventory.useCases.receiveStock.execute(tenantId, data));
    return c.json({ success: true, result }, 201);
};

export const moveStockHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const data = c.get('validatedData');

    unwrap(await inventory.useCases.moveStock.execute(tenantId, data));
    return c.json({ success: true });
};
