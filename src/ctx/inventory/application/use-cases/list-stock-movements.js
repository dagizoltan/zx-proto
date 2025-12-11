import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createListStockMovements = ({ stockMovementRepository }) => {
  const execute = async (tenantId, productId, { limit = 20, cursor } = {}) => {
    // getByProduct -> queryByIndex('product', productId)
    return await stockMovementRepository.queryByIndex(tenantId, 'product', productId, { limit, cursor });
  };
  return { execute };
};
