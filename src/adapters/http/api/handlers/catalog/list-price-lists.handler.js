export const listPriceListsHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const catalog = c.ctx.get('domain.catalog');
  const cursor = c.req.query('cursor');
  const limit = parseInt(c.req.query('limit') || '50');

  const result = await catalog.useCases.listPriceLists.execute(tenantId, { limit, cursor });
  return c.json(result);
};
