import { toApiProduct } from '../../transformers/catalog.transformer.js';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const getProductHandler = async (c) => {
  const id = c.req.param('id');
  const tenantId = c.get('tenantId');
  const catalog = c.ctx.get('domain.catalog'); // Switch to Catalog

  const res = await catalog.useCases.getProduct.execute(tenantId, id);

  if (isErr(res)) {
      if (res.error.code === 'NOT_FOUND') {
          return c.json({ error: 'Product not found' }, 404);
      }
      throw res.error; // Let global handler catch 500
  }

  return c.json(toApiProduct(res.value));
};
