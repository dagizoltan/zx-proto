// Placeholder for stock operations
// Since receive-stock.js and move-stock.js use cases exist.

export const receiveStockHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const data = c.get('validatedData');

    // receiveStock expects (tenantId, { productId, locationId, quantity, ... })
    const result = await inventory.useCases.receiveStock.execute(tenantId, data);
    return c.json({ success: true, result }, 201);
};

export const moveStockHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const data = c.get('validatedData');

    await inventory.useCases.moveStock.execute(tenantId, data);
    return c.json({ success: true });
};
