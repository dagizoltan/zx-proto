import { unwrap, isErr } from '../../../../../lib/trust/index.js';

export const createGetDashboardStats = ({ registry, config }) => {
  const limits = config ? config.get('query.limits') : { default: 20, max: 100, internal: 500 };

  const execute = async (tenantId) => {
    // Access Domains
    const ordersDomain = registry.get('domain.orders');
    const inventoryDomain = registry.get('domain.inventory');
    const manufacturingDomain = registry.get('domain.manufacturing');
    const procurementDomain = registry.get('domain.procurement');
    const accessControlDomain = registry.get('domain.access-control');
    const observabilityDomain = registry.get('domain.observability');

    // Helper to safely list items whether it's legacy (array) or new (Result)
    const safeList = async (repo, options = {}) => {
        if (!repo) return [];
        try {
            // Try 'list' (New & Trust Standard)
            if (repo.list) {
                const res = await repo.list(tenantId, { limit: limits.internal, ...options });
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
            // Try 'query' (Some repos use query for list)
            if (repo.query) {
                const res = await repo.query(tenantId, { limit: limits.internal, ...options });
                if (res && typeof res.ok === 'boolean') {
                     if (isErr(res)) return [];
                     return res.value.items || res.value;
                }
            }
            return [];
        } catch (e) {
            return [];
        }
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
    const pendingShipments = allShipments.filter(s => s.status === 'PENDING').length;

    // 3. MANUFACTURING Stats
    let allWorkOrders = [];
    let activeWorkOrders = 0;
    let recentWorkOrders = [];
    if (manufacturingDomain?.repositories?.workOrder) {
        allWorkOrders = await safeList(manufacturingDomain.repositories.workOrder);
        activeWorkOrders = allWorkOrders.filter(wo => wo.status === 'IN_PROGRESS' || wo.status === 'PLANNED').length;
        recentWorkOrders = [...allWorkOrders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
    }

    // 4. PROCUREMENT Stats
    let openPurchaseOrders = 0;
    if (procurementDomain?.repositories?.purchaseOrder) {
        const allPOs = await safeList(procurementDomain.repositories.purchaseOrder);
        openPurchaseOrders = allPOs.filter(po => ['DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED'].includes(po.status)).length;
    }

    // 5. CRM Stats
    let totalCustomers = 0;
    if (accessControlDomain?.repositories?.user) {
        const allUsers = await safeList(accessControlDomain.repositories.user);
        totalCustomers = allUsers.length;
    }

    // 6. INVENTORY Stats
    let lowStockCount = 0;
    let totalInventoryValue = 0;
    if (inventoryDomain?.repositories?.product && inventoryDomain?.repositories?.stock) {
        const products = await safeList(inventoryDomain.repositories.product);

        await Promise.all(products.map(async (p) => {
            try {
                let entries = [];
                const repo = inventoryDomain.repositories.stock;

                // Try queryByIndex (Trust Standard)
                if (repo.queryByIndex) {
                     const stockRes = await repo.queryByIndex(tenantId, 'product', p.id);
                     if (stockRes && !isErr(stockRes)) entries = stockRes.value.items || stockRes.value;
                }
                // Try findByProduct (Legacy)
                else if (repo.findByProduct) {
                     const stockRes = await repo.findByProduct(tenantId, p.id);
                     if (stockRes && typeof stockRes.ok === 'boolean') {
                        if (!isErr(stockRes)) entries = stockRes.value.items || stockRes.value;
                     } else if (stockRes) {
                        entries = stockRes.items || stockRes;
                     }
                }

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
    if (observabilityDomain?.repositories?.audit) {
         try {
            const audits = await safeList(observabilityDomain.repositories.audit);
            recentActivity = audits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
            // Assuming errors might be in audits or another repo, but original code just listed audits.
            // Original code had 'systemErrors' variable but didn't seem to calculate it from audits?
            // Ah, the original code I restored had: `let systemErrors = 0;` and didn't update it.
            // So hardcoded 0 is preserving behavior.
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
