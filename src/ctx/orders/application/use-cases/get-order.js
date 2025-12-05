export const createGetOrder = ({ orderRepository }) => {
  const execute = async (tenantId, orderId) => {
    return orderRepository.findById(tenantId, orderId);
  };
  return { execute };
};
