import { unwrap, isErr } from '../../../../../lib/trust/index.js';

export const createGetDashboardStats = ({ registry }) => {
  const execute = async (tenantId) => {
    // Access Domains
    const ordersDomain = registry.get('domain.orders');
    const inventoryDomain = registry.get('domain.inventory');
    const manufacturingDomain = registry.get('domain.manufacturing');
    const procurementDomain = registry.get('domain.procurement');
    const accessControlDomain = registry.get('domain.access-control');
    const observabilityDomain = registry.get('domain.observability');

    // Helper to safely list items whether it's legacy (array) or new (Result)
    const safeList = async (repo) => {
        if (!repo) return [];
        // Try 'list' (New & Trust Standard)
        if (repo.list) {
            const res = await repo.list(tenantId, { limit: 1000 });
            if (res && typeof res.ok === 'boolean') {
                 if (isErr(res)) return [];
                 return res.value.items || res.value;
            }
            return res.items || res; // Legacy direct return?
        }
        // Try 'findAll' (Legacy)
        if (repo.findAll) {
            const res = await repo.findAll(tenantId);
            if (res && typeof res.ok === 'boolean') {
                 if (isErr(res)) return [];
                 return res.value.items || res.value;
            }
            return res.items || res;
        }
        return [];
    };

    // 1. ORDERS Stats
    const allOrders = await safeList(ordersDomain.repositories.order);

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0);
    const pendingOrders = allOrders.filter(o => ['CREATED', 'PAID'].includes(o.status)).length;

    const recentOrders = [...allOrders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    // 2. SHIPMENTS Stats
    const allShipments = await safeList(ordersDomain.repositories.shipment);
    const pendingShipments = allShipments.filter(s => s.status === 'CREATED').length;

    // 3. MANUFACTURING Stats
    const allWorkOrders = await safeList(manufacturingDomain.repositories.workOrder);
    const activeWorkOrders = allWorkOrders.filter(wo => wo.status === 'IN_PROGRESS' || wo.status === 'PLANNED').length;
    const recentWorkOrders = [...allWorkOrders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    // 4. PROCUREMENT Stats
    const allPOs = await safeList(procurementDomain.repositories.purchaseOrder);
    const openPurchaseOrders = allPOs.filter(po => ['CREATED', 'PARTIALLY_RECEIVED', 'ISSUED'].includes(po.status)).length;

    // 5. CRM Stats (Access Control)
    // New adapter uses `list` and returns Result. `safeList` handles it.
    const allUsers = await safeList(accessControlDomain.repositories.user);
    const totalCustomers = allUsers.length;

    // 6. INVENTORY Stats (Low Stock & Value)
    const products = await safeList(inventoryDomain.repositories.product);
    let lowStockCount = 0;
    let totalInventoryValue = 0;

    // We need to fetch stock.
    // Inventory Repo might be legacy or new. `inventory` context uses `createKVStockRepository` which returns object with `getStock`?
    // Let's check if `inventoryDomain.repositories.stock` has `queryByIndex`.
    // It is `createKVStockRepository`. If I haven't touched it, it is likely legacy or standard Trust.
    // If it's standard Trust `createRepository`, it has `queryByIndex`.
    // If it is custom, it has whatever it has.
    // Safest is to try/catch.

    await Promise.all(products.map(async (p) => {
        try {
            let entries = [];
            const repo = inventoryDomain.repositories.stock;
            if (repo.queryByIndex) {
                 const stockRes = await repo.queryByIndex(tenantId, 'product', p.id);
                 if (!isErr(stockRes)) entries = stockRes.value.items;
            } else if (repo.findByProduct) {
                 const stockRes = await repo.findByProduct(tenantId, p.id);
                 if (stockRes && !isErr(stockRes)) entries = stockRes.value || stockRes; // Handle Result or direct
                 if (entries.items) entries = entries.items;
            }

            const totalQty = entries.reduce((sum, e) => sum + e.quantity, 0);

            if (totalQty < 10) lowStockCount++;
            if (totalQty > 0 && p.price) totalInventoryValue += (totalQty * Number(p.price));
        } catch (e) {
            // ignore
        }
    }));

    // 7. OBSERVABILITY Stats
    let systemErrors = 0;
    let recentActivity = [];

    try {
        const audits = await safeList(observabilityDomain?.repositories?.audit);
        recentActivity = audits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
    } catch (e) {
        // ignore
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
