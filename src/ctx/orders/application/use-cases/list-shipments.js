import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createListShipments = ({ shipmentRepository }) => {
  const execute = async (tenantId, { orderId, limit = 20, cursor } = {}) => {
    if (orderId) {
        // findByOrderId -> queryByIndex('order', orderId)
        return await shipmentRepository.queryByIndex(tenantId, 'order', orderId, { limit, cursor });
    }
    // findAll -> list
    return shipmentRepository.list(tenantId, { limit, cursor });
  };

  return { execute };
};
