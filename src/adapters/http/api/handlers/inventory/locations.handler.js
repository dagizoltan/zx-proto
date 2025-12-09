import { toApiLocation } from '../../transformers/inventory.transformer.js';

export const listLocationsHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    // Similar to warehouses, use case might be missing.
    // "The Locations page ... aggregates locations by iterating through all warehouses"
    // I will iterate warehouses and get locations.

    const warehouses = await inventory.repositories.warehouse.findAll(tenantId);
    let allLocations = [];
    for (const wh of warehouses) {
        const locs = await inventory.repositories.location.findByWarehouse(tenantId, wh.id);
        allLocations = allLocations.concat(locs);
    }

    return c.json({ items: allLocations.map(toApiLocation) });
};

export const createLocationHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const data = c.get('validatedData');

    const loc = await inventory.useCases.createLocation.execute(tenantId, data);
    return c.json(toApiLocation(loc), 201);
};
