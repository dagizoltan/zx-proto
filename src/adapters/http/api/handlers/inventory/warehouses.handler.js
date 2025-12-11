import { toApiWarehouse } from '../../transformers/inventory.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listWarehousesHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const result = unwrap(await inventory.repositories.warehouse.list(tenantId, { limit: 100 }));
    return c.json({ items: result.items.map(toApiWarehouse) });
};

export const createWarehouseHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const data = c.get('validatedData');

    const wh = unwrap(await inventory.useCases.createWarehouse.execute(tenantId, data));
    return c.json(toApiWarehouse(wh), 201);
};
