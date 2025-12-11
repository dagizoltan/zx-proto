import { Ok } from '../../../../../lib/trust/index.js';

export const createListCategories = ({ categoryRepository }) => {
  const execute = async (tenantId, params = {}) => {
    // categoryRepository.list returns { items, nextCursor }
    // Legacy support? No, we rebase fully.
    return categoryRepository.list(tenantId, params);
  };

  return { execute };
};
