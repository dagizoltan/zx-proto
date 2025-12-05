export const createGetDashboardStats = ({ orderRepository }) => {
  const execute = async (tenantId) => {
    // Basic stats implementation
    const { items: orders } = await orderRepository.findAll(tenantId, { limit: 1000 }); // Naive fetch for stats

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'CREATED' || o.status === 'PAID').length;

    return {
        totalOrders,
        totalRevenue,
        pendingOrders,
        recentOrders: orders.slice(0, 5)
    };
  };
  return { execute };
};
