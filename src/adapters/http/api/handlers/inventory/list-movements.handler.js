export const listStockMovementsHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const inventory = c.ctx.get('domain.inventory');
  const productId = c.req.query('productId');
  const cursor = c.req.query('cursor');
  const limit = parseInt(c.req.query('limit') || '20');

  // If productId is provided, use the specific use case
  // If not, we might need a general "list all movements" use case which might not exist efficiently
  // The repo supports listing all? The repository usually is partitioned by Product or Location.
  // The KVStockMovementRepository uses `['tenants', tenantId, 'movements', productId, timestamp]`.
  // So listing *all* movements across *all* products is hard without a secondary index.
  // BUT, let's check the use case or repo capabilities.

  if (productId) {
    const result = await inventory.useCases.listStockMovements.execute(tenantId, productId, { limit, cursor });
    return c.json(result);
  } else {
     // TODO: Implement "List All Movements" with secondary index or scan
     return c.json({ error: 'productId query parameter is required' }, 400);
  }
};
