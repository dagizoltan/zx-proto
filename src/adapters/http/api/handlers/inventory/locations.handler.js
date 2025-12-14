import { toApiLocation } from '../../transformers/inventory.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listLocationsHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    const warehouseRes = await inventory.repositories.warehouse.list(tenantId, { limit: 100 });
    const warehouses = unwrap(warehouseRes).items;

    let allLocations = [];
    for (const wh of warehouses) {
        // findByWarehouse -> queryByIndex
        const locRes = await inventory.repositories.location.queryByIndex(tenantId, 'warehouse', wh.id, { limit: c.ctx.get('config').get('query.limits.internal') });
        const locs = unwrap(locRes).items;
        allLocations = allLocations.concat(locs);
    }

    return c.json({ items: allLocations.map(toApiLocation) });
};

export const createLocationHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const data = c.get('validatedData');

    const loc = unwrap(await inventory.useCases.createLocation.execute(tenantId, data));
    return c.json(toApiLocation(loc), 201);
};
