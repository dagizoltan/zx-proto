export const createListShipments = ({ shipmentRepository }) => {
  const execute = async (tenantId, { orderId, limit, cursor } = {}) => {
    if (orderId) {
        // findByOrderId doesn't support pagination in current repo impl (returns all array)
        // We can slice it in memory if needed, or update repo.
        const items = await shipmentRepository.findByOrderId(tenantId, orderId);
        return { items, nextCursor: null };
    }
    return shipmentRepository.findAll(tenantId, { limit, cursor });
  };

  return { execute };
};
