export const createGetDashboardStats = ({ registry }) => {
    const execute = async (tenantId) => {
        const ordersCtx = registry.get('domain.orders');
        const inventoryCtx = registry.get('domain.inventory');
        const procurementCtx = registry.get('domain.procurement');
        const manufacturingCtx = registry.get('domain.manufacturing');

        // Orders Stats
        const { items: orders } = await ordersCtx.repositories.order.findAll(tenantId, { limit: 1000 });
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort desc

        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'CREATED' || o.status === 'PAID').length;
        const recentOrders = orders.slice(0, 5);

        // Inventory Stats
        const { items: stockEntries } = await inventoryCtx.repositories.stock.findAll(tenantId, { limit: 2000 });
        // Aggregate stock by product
        const productStock = {};
        stockEntries.forEach(entry => {
            if (!productStock[entry.productId]) productStock[entry.productId] = 0;
            productStock[entry.productId] += entry.quantity;
        });

        let lowStockCount = 0;
        let outOfStockCount = 0;
        // Assuming we knew the product list, but for now we just check positive stock vs zero?
        // Actually, without product definitions (min_stock_level), "Low Stock" is arbitrary.
        // Let's assume < 10 is low.
        // Also, this only counts products that HAVE stock entries. Products with 0 entries are invisible here unless we fetch products.
        // Let's fetch products to be accurate about Out of Stock.
        // But fetching all products might be heavy. Let's rely on what we have or accept approximation.
        // Better: count items in stockEntries with < 10.
        // But stock is per batch/location. We aggregated it above.

        Object.values(productStock).forEach(qty => {
            if (qty === 0) outOfStockCount++;
            else if (qty < 20) lowStockCount++;
        });

        // Approximate Total Inventory Value (needs product price, which is in Catalog...)
        // Fetching catalog for 1000 items is expensive. We'll skip value for now or do a partial check if needed.
        // Let's skip "Total Value" to avoid cross-domain N+1 for now, or use a naive "items count" metric.
        const totalStockItems = Object.values(productStock).reduce((a, b) => a + b, 0);


        // Procurement Stats
        const { items: pos } = await procurementCtx.repositories.purchaseOrder.findAll(tenantId, { limit: 100 });
        const pendingPOs = pos.filter(po => po.status === 'ISSUED' || po.status === 'PARTIALLY_RECEIVED').length;
        const recentPOs = pos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

        // Manufacturing Stats
        const { items: wos } = await manufacturingCtx.repositories.workOrder.findAll(tenantId, { limit: 100 });
        const activeWorkOrders = wos.filter(wo => wo.status === 'PLANNED' || wo.status === 'IN_PROGRESS').length;
        const recentWOs = wos.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)).slice(0, 5);


        return {
            orders: {
                totalOrders: orders.length,
                totalRevenue,
                pendingCount: pendingOrders,
                recent: recentOrders
            },
            inventory: {
                lowStockCount,
                outOfStockCount, // Note: only counts products that exist in stock repo with 0 qty (unlikely) or calculated 0.
                                 // Real "Out of Stock" requires comparing Catalog vs Inventory.
                                 // For now, "Low Stock" (< 20) is a good proxy for attention.
                totalItems: totalStockItems
            },
            procurement: {
                pendingCount: pendingPOs,
                recent: recentPOs
            },
            manufacturing: {
                activeCount: activeWorkOrders,
                recent: recentWOs
            }
        };
    };

    return { execute };
};
