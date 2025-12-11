import { unwrap } from '../../../../../../lib/trust/index.js';

export const listStockMovementsHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const inventory = c.ctx.get('domain.inventory');
  const productId = c.req.query('productId');
  const cursor = c.req.query('cursor');
  const limit = parseInt(c.req.query('limit') || '20');

  if (productId) {
    const result = unwrap(await inventory.useCases.listStockMovements.execute(tenantId, productId, { limit, cursor }));
    // result is { items, nextCursor }
    return c.json(result);
  } else {
     return c.json({ error: 'productId query parameter is required' }, 400);
  }
};
