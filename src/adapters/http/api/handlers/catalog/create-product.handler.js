import { toApiProduct } from '../../transformers/catalog.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createProductHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog'); // Was inventory, now catalog is correct context for createProduct
    const obs = c.ctx.get('domain.observability').obs;

    // Validated data comes from middleware
    const data = c.get('validatedData');

    // Unwrap result (throws on error, which Global Error Handler catches)
    // Note: useCases.createProduct returns Result now.
    const product = unwrap(await catalog.useCases.createProduct.execute(tenantId, data));

    await obs.audit('Product created', {
      tenantId,
      productId: product.id,
      sku: product.sku,
    });

    return c.json(toApiProduct(product), 201);
};
