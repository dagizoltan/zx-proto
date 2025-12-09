import { toApiProduct } from '../../transformers/catalog.transformer.js';

export const getProductHandler = async (c) => {
  const id = c.req.param('id');
  const tenantId = c.get('tenantId');
  const inventory = c.ctx.get('domain.inventory');

  const product = await inventory.useCases.getProduct.execute(tenantId, id);

  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }

  return c.json(toApiProduct(product));
};
