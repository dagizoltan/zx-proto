import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { createCategory } from '../../domain/entities/category.js';

export const createCreateCategory = ({ categoryRepository }) => {
  const execute = async (tenantId, data) => {
    try {
        const category = createCategory({
            id: crypto.randomUUID(),
            ...data
        });

        return categoryRepository.save(tenantId, category);
    } catch (e) {
        return Err({ code: 'VALIDATION_ERROR', message: e.message });
    }
  };

  return { execute };
};
