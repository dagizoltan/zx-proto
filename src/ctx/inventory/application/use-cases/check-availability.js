import { Ok, Err, isErr, unwrap } from '@lib/trust/index.js';

export const createCheckAvailability = ({ stockRepository, cache }) => {
  const execute = async (tenantId, productId, quantity) => {
    // getStock -> queryByIndex
    const res = await stockRepository.queryByIndex(tenantId, 'product', productId, { limit: 1000 });
    if (isErr(res)) return false; // Or Err

    const entries = res.value.items;
    const total = entries.reduce((sum, e) => sum + (e.quantity - (e.reservedQuantity || 0)), 0);

    // Return boolean or Result<Boolean>?
    // Handlers expect boolean usually?
    // Let's return Result<Boolean> to be consistent, but route handler unwraps/checks it.
    // product-detail-routes.js: `availability = avRes.ok && avRes.value`
    return Ok(total >= quantity);
  };

  return { execute };
};
