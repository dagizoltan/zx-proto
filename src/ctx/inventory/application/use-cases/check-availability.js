import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createCheckAvailability = ({ stockRepository, cache }) => {
  const execute = async (tenantId, productId, quantity) => {
    // getStock -> queryByIndex
    const res = await stockRepository.findByProduct(tenantId, productId);
    if (isErr(res)) return res; // Return Err if failed

    const entries = res.value;
    const total = entries.reduce((sum, e) => sum + (e.quantity - (e.reservedQuantity || e.reserved || 0)), 0);

    return Ok(total >= quantity);
  };

  return { execute };
};
