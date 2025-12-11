import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { ProductSchema } from '../../../../ctx/catalog/domain/schemas/catalog.schema.js';

export const createKVProductRepository = (kvPool) => {
  return createRepository(kvPool, 'products', [
    useSchema(ProductSchema),
    useIndexing({
        'sku': (p) => p.sku,
        'status': (p) => p.status,
        'category': (p) => p.categoryId,
        'parent': (p) => p.parentId
    })
  ]);
};
