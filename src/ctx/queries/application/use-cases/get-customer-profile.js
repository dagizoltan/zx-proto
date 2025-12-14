import { isErr } from '../../../../../lib/trust/index.js';

export const createGetCustomerProfile = ({ userRepository, orderRepository, obs }) => {
  const execute = async (tenantId, userId) => {

    // 1. Fetch User
    const userRes = await userRepository.findById(tenantId, userId);
    if (isErr(userRes)) {
        throw new Error(`Error fetching user: ${userRes.error.message}`);
    }
    const user = userRes.value;

    if (!user) {
      throw new Error('Customer not found');
    }

    // 2. Fetch Orders
    // We standardized OrderRepository to use `query`.
    // It doesn't have `findByUserId` anymore unless I added it.
    // I added `queryByIndex` and `query`.
    // OrderRepository indexes `customerId`.
    // So we use `query` with filter.

    let orders = [];
    // Assuming 'customerId' matches the index name I set in `kv-order-repository.adapter.js`
    const ordersRes = await orderRepository.query(tenantId, { filter: { customerId: userId } });

    if (isErr(ordersRes)) throw new Error(`Error fetching orders: ${ordersRes.error.message}`);
    orders = ordersRes.value.items;

    // 3. Clean up user data
    const { passwordHash, ...safeUser } = user;

    return {
      user: safeUser,
      orders: orders || []
    };
  };

  return { execute };
};
