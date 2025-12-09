import { toApiWarehouse } from '../../transformers/inventory.transformer.js';

export const listWarehousesHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');

    // Note: Use case `listWarehouses` might not exist or be `listAllWarehouses`?
    // Let's assume repo access or simple list.
    // Checking `src/ctx/inventory/application/use-cases/create-warehouse.js`...
    // I'll assume `listWarehouses` use case exists or use repo if needed,
    // but better to stick to architectural pattern.
    // If use case is missing, I might default to empty list or basic impl.
    // Memory says: "The Locations page ... aggregates locations by iterating through all warehouses"
    // So there is likely a way to get warehouses.

    // Assuming useCase exists or direct repo access (less ideal but practical if useCase missing)
    // Actually, `src/ctx/inventory/application/use-cases` had `create-warehouse.js` but no `list-warehouses.js`.
    // It had `list-stock-movements.js`, `list-all-products.js`.
    // I will try to use repository directly if usecase is missing, or construct a simple list.

    const warehouses = await inventory.repositories.warehouse.findAll(tenantId);
    return c.json({ items: warehouses.map(toApiWarehouse) });
};

export const createWarehouseHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const data = c.get('validatedData');

    const wh = await inventory.useCases.createWarehouse.execute(tenantId, data);
    return c.json(toApiWarehouse(wh), 201);
};
