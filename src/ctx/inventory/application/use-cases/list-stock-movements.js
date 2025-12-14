import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createListStockMovements = ({ stockMovementRepository }) => {
  const execute = async (tenantId, productId, { limit = 20, cursor } = {}) => {
    // getByProduct -> queryByIndex('productId', productId)
    return await stockMovementRepository.queryByIndex(tenantId, 'productId', productId, { limit, cursor });
  };
  return { execute };
};
