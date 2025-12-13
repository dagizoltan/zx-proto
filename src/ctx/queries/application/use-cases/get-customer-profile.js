import { isErr } from '../../../../../lib/trust/index.js';

export const createGetCustomerProfile = ({ registry, obs }) => {
  const execute = async (tenantId, userId) => {
    const accessControl = registry.get('domain.access-control');
    const ordersContext = registry.get('domain.orders');

    // 1. Fetch User
    // Now `findById` returns Result<{ ok, value }>
    const userRes = await accessControl.repositories.user.findById(tenantId, userId);
    if (isErr(userRes)) {
        // Handle error or return null/error
        throw new Error(`Error fetching user: ${userRes.error.message}`);
    }
    const user = userRes.value;

    if (!user) {
      throw new Error('Customer not found');
    }

    // 2. Fetch Orders
    // ordersContext.repositories.order is likely OLD repository type which returns array?
    // Wait, the plan said "Strictly focus on access-control".
    // I haven't touched orders.
    // So `findByUserId` should work as before (returning array or Result-wrapped array?).
    // Usually Trust Platform legacy repos returned Result or Array.
    // If it returns Result, I should unwrap it.
    // Let's assume it returns Result if it follows Trust pattern.
    // But safely handle it.
    let orders = [];
    const ordersRes = await ordersContext.repositories.order.findByUserId(tenantId, userId);

    if (ordersRes && typeof ordersRes.ok === 'boolean') {
        if (isErr(ordersRes)) throw new Error(`Error fetching orders: ${ordersRes.error.message}`);
        orders = ordersRes.value;
    } else {
        orders = ordersRes;
    }

    // 3. Clean up user data
    const { passwordHash, ...safeUser } = user;

    return {
      user: safeUser,
      orders: orders || []
    };
  };

  return { execute };
};
