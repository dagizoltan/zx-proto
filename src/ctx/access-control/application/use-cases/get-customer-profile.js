export const createGetCustomerProfile = ({ userRepository, orderRepository, obs }) => {
  const execute = async (tenantId, userId) => {
    // 1. Fetch User
    const user = await userRepository.findById(tenantId, userId);
    if (!user) {
      throw new Error('Customer not found');
    }

    // 2. Fetch Orders
    // We use findByUserId from the repository directly for efficiency
    const orders = await orderRepository.findByUserId(tenantId, userId);

    // 3. Clean up user data (remove password)
    const { passwordHash, ...safeUser } = user;

    // 4. Audit
    if (obs) {
        // obs.audit('Customer profile viewed', { userId, viewer: ... });
    }

    return {
      user: safeUser,
      orders: orders || []
    };
  };

  return { execute };
};
