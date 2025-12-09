import { toApiProduct } from '../../transformers/catalog.transformer.js';

export const createProductHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const inventory = c.ctx.get('domain.inventory');
    const obs = c.ctx.get('infra.obs');

    // Validated data comes from middleware
    const data = c.get('validatedData');

    const product = await inventory.useCases.createProduct.execute(tenantId, data);

    await obs.audit('Product created', {
      tenantId,
      productId: product.id,
      sku: product.sku,
    });

    return c.json(toApiProduct(product), 201);
};
