import { unwrap, isErr } from '../../../../../lib/trust/index.js';

export const createGetDashboardStats = ({
    orderRepository,
    shipmentRepository,
    workOrderRepository,
    poRepository,
    userRepository,
    stockRepository,
    productRepository,
    auditRepository
}) => {
  const execute = async (tenantId) => {

    // Helper to safely list items from Trust Repositories
    const listAll = async (repo, options = {}) => {
        if (!repo) return [];
        // Use standard 'list' or 'query'
        const res = await repo.list(tenantId, { limit: 1000, ...options });
        if (isErr(res)) return [];
        return res.value.items;
    };

    // 1. ORDERS Stats
    const allOrders = await listAll(orderRepository);
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0);
    const pendingOrders = allOrders.filter(o => ['CREATED', 'PAID'].includes(o.status)).length;
    const recentOrders = [...allOrders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    // 2. SHIPMENTS Stats
    const allShipments = await listAll(shipmentRepository);
    const pendingShipments = allShipments.filter(s => s.status === 'PENDING').length;

    // 3. MANUFACTURING Stats
    let activeWorkOrders = 0;
    let recentWorkOrders = [];
    if (workOrderRepository) {
        const allWorkOrders = await listAll(workOrderRepository);
        activeWorkOrders = allWorkOrders.filter(wo => wo.status === 'IN_PROGRESS' || wo.status === 'PLANNED').length;
        recentWorkOrders = [...allWorkOrders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
    }

    // 4. PROCUREMENT Stats
    let openPurchaseOrders = 0;
    if (poRepository) {
        const allPOs = await listAll(poRepository);
        openPurchaseOrders = allPOs.filter(po => ['DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED'].includes(po.status)).length;
    }

    // 5. CRM Stats
    let totalCustomers = 0;
    if (userRepository) {
        // Users are paginated, but listAll gets first 1000
        const allUsers = await listAll(userRepository);
        totalCustomers = allUsers.length;
    }

    // 6. INVENTORY Stats
    let lowStockCount = 0;
    let totalInventoryValue = 0;
    if (productRepository && stockRepository) {
        const products = await listAll(productRepository);

        // We could run this in parallel but limit concurrency if needed
        await Promise.all(products.map(async (p) => {
            try {
                // Use standard query with property filter
                const stockRes = await stockRepository.query(tenantId, {
                    filter: { productId: p.id },
                    limit: 1000
                });

                if (isErr(stockRes)) return;

                const entries = stockRes.value.items;
                const totalQty = entries.reduce((sum, e) => sum + e.quantity, 0);

                if (totalQty < 10) lowStockCount++;
                if (totalQty > 0 && p.price) totalInventoryValue += (totalQty * Number(p.price));
            } catch (e) {
                // ignore
            }
        }));
    }

    // 7. OBSERVABILITY Stats
    let systemErrors = 0;
    let recentActivity = [];
    if (auditRepository) {
         try {
            const audits = await listAll(auditRepository);
            recentActivity = audits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
         } catch (e) {
            // ignore
         }
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
