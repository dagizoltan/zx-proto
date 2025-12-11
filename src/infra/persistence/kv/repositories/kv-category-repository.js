import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { CategorySchema } from '../../../../ctx/catalog/domain/schemas/catalog.schema.js';

export const createKVCategoryRepository = (kvPool) => {
  return createRepository(kvPool, 'categories', [
    useSchema(CategorySchema),
    useIndexing({
        'parent': (c) => c.parentId
    })
  ]);
};
