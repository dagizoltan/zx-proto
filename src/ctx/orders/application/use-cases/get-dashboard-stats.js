export const createGetDashboardStats = ({ orderRepository }) => {
  const execute = async (tenantId) => {
    // Basic stats implementation
    // We limit to 1000 for performance, but in real enterprise this should be a pre-calculated aggregate or indexed query.
    const { items: orders } = await orderRepository.findAll(tenantId, { limit: 1000 });

    const totalOrders = orders.length;
    // Fix: Handle potential undefined total
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'CREATED' || o.status === 'PAID').length;

    // Sort orders by date descending to get recent ones correct
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
        totalOrders,
        totalRevenue,
        pendingOrders,
        recentOrders: orders.slice(0, 5)
    };
  };
  return { execute };
};
