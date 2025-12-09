export const createGetCustomerProfile = ({ registry, obs }) => {
  const execute = async (tenantId, userId) => {
    const accessControl = registry.get('domain.access-control');
    const ordersContext = registry.get('domain.orders');

    // 1. Fetch User
    const user = await accessControl.repositories.user.findById(tenantId, userId);
    if (!user) {
      throw new Error('Customer not found');
    }

    // 2. Fetch Orders
    const orders = await ordersContext.repositories.order.findByUserId(tenantId, userId);

    // 3. Clean up user data
    const { passwordHash, ...safeUser } = user;

    return {
      user: safeUser,
      orders: orders || []
    };
  };

  return { execute };
};
