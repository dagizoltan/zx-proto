export const createGetDashboardStats = ({ registry }) => {
  const execute = async (tenantId) => {
    // Access Domains
    const ordersDomain = registry.get('domain.orders');
    const inventoryDomain = registry.get('domain.inventory');
    const manufacturingDomain = registry.get('domain.manufacturing');
    const procurementDomain = registry.get('domain.procurement');
    const accessControlDomain = registry.get('domain.access-control');
    const observabilityDomain = registry.get('domain.observability');

    // 1. ORDERS Stats
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
    const { items: allUsers } = await accessControlDomain.repositories.user.findAll(tenantId, { limit: 1000 });
    const totalCustomers = allUsers.length;

    // 6. INVENTORY Stats (Low Stock & Value)
    const { items: products } = await inventoryDomain.repositories.product.findAll(tenantId, { limit: 100 });
    let lowStockCount = 0;
    let totalInventoryValue = 0;

    await Promise.all(products.map(async (p) => {
        const stock = await inventoryDomain.repositories.stock.getStock(tenantId, p.id);

        // Low Stock Check
        if (stock < 10) {
            lowStockCount++;
        }

        // Inventory Value
        if (stock > 0 && p.price) {
            totalInventoryValue += (stock * Number(p.price));
        }
    }));

    // 7. OBSERVABILITY Stats
    // Assuming we can list logs. If not, we might need to skip or mock.
    // We try to fetch logs via 'observability' domain if repository is available.
    let systemErrors = 0;
    let recentActivity = [];

    if (observabilityDomain && observabilityDomain.repositories.logs) {
        // Fetch recent error logs (last 24h approximation: limit 100 and filter)
        // Note: Real implementation should filter by date in query if possible.
        // The logs repo uses 'list' not 'findAll' and requires a level.
        const { items: logs } = await observabilityDomain.repositories.logs.list(tenantId, { level: 'ERROR', limit: 100 });
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        systemErrors = logs.filter(l =>
            new Date(l.timestamp) > oneDayAgo
        ).length;
    }

    if (observabilityDomain && observabilityDomain.repositories.audit) {
         // The audit repo uses 'list' (or inherited list from log repo which needs level if raw log repo)
         // but createKVAuditRepository exposes 'list' that presets level='audit'.
         const { items: audits } = await observabilityDomain.repositories.audit.list(tenantId, { limit: 10 });
         recentActivity = audits
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
    }

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
            lowStockCount: lowStockCount,
            totalValue: totalInventoryValue
        },
        system: {
            errors24h: systemErrors,
            recentActivity: recentActivity,
            status: systemErrors > 0 ? 'WARN' : 'HEALTHY'
        }
    };
  };

  return { execute };
};
