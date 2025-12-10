export const createGetDashboardStats = ({ registry }) => {
  const execute = async (tenantId) => {
    // Access Domains
    const ordersDomain = registry.get('domain.orders');
    const inventoryDomain = registry.get('domain.inventory');
    const manufacturingDomain = registry.get('domain.manufacturing');
    const procurementDomain = registry.get('domain.procurement');
    const accessControlDomain = registry.get('domain.access-control');

    // 1. ORDERS Stats
    // We use a larger limit to get a decent count, though for "Total" we should ideally use a count method if available.
    // Since repositories currently only have findAll/list, we fetch a batch.
    // In a real app, we'd add .count() methods to repositories.
    const { items: allOrders } = await ordersDomain.repositories.order.findAll(tenantId, { limit: 1000 });
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingOrders = allOrders.filter(o => ['CREATED', 'PAID'].includes(o.status)).length;

    // Recent Orders (sort by date desc)
    const recentOrders = [...allOrders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    // 2. SHIPMENTS Stats
    const { items: allShipments } = await ordersDomain.repositories.shipment.findAll(tenantId, { limit: 1000 });
    const pendingShipments = allShipments.filter(s => s.status === 'CREATED').length;

    // 3. MANUFACTURING Stats
    const { items: allWorkOrders } = await manufacturingDomain.repositories.workOrder.findAll(tenantId, { limit: 1000 });
    const activeWorkOrders = allWorkOrders.filter(wo => wo.status === 'IN_PROGRESS' || wo.status === 'PLANNED').length;

    // Recent Work Orders
    const recentWorkOrders = [...allWorkOrders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    // 4. PROCUREMENT Stats
    const { items: allPOs } = await procurementDomain.repositories.purchaseOrder.findAll(tenantId, { limit: 1000 });
    const openPurchaseOrders = allPOs.filter(po => ['CREATED', 'PARTIALLY_RECEIVED'].includes(po.status)).length;

    // 5. CRM Stats
    // Assuming 'customer' role check is needed, or just total users for now.
    const { items: allUsers } = await accessControlDomain.repositories.user.findAll(tenantId, { limit: 1000 });
    const totalCustomers = allUsers.length; // Improving this would require filtering by role

    // 6. INVENTORY Stats (Low Stock)
    // Fetch products and check stock. Limit to 100 for performance.
    const { items: products } = await inventoryDomain.repositories.product.findAll(tenantId, { limit: 100 });
    let lowStockCount = 0;

    // We can run these in parallel
    await Promise.all(products.map(async (p) => {
        const stock = await inventoryDomain.repositories.stock.getStock(tenantId, p.id);
        // Default threshold 10
        if (stock < 10) {
            lowStockCount++;
        }
    }));

    return {
        orders: {
            total: totalOrders,
            revenue: totalRevenue,
            pending: pendingOrders,
            recent: recentOrders
        },
        shipments: {
            pending: pendingShipments
        },
        manufacturing: {
            activeWorkOrders: activeWorkOrders,
            recent: recentWorkOrders
        },
        procurement: {
            openPOs: openPurchaseOrders
        },
        crm: {
            totalCustomers: totalCustomers
        },
        inventory: {
            lowStockCount: lowStockCount
        }
    };
  };

  return { execute };
};
