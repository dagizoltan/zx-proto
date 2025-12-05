import { Random, Log } from './utils.js';

export const seedInventory = async (ctx, tenantId, products) => {
    Log.step('Seeding Inventory (Warehouses, Locations, Initial Stock)');
    const inventory = ctx.get('domain.inventory');

    // 1. Warehouses
    const whData = [
        { name: 'NY Distribution', code: 'WH-NY' },
        { name: 'LA Hub', code: 'WH-LA' },
        { name: 'Chicago Central', code: 'WH-CHI' }
    ];
    const warehouses = [];

    for (const w of whData) {
        try {
            const wh = await inventory.useCases.createWarehouse.execute(tenantId, w);
            warehouses.push(wh);
        } catch (e) {
            const all = await inventory.repositories.warehouse.findAll(tenantId);
            warehouses.push(all.find(x => x.code === w.code));
        }
    }

    // 2. Locations (Bins)
    const locationIds = [];
    for (const wh of warehouses) {
        if (!wh) continue;
        // Create 20 bins per warehouse
        for (let i = 1; i <= 20; i++) {
            const code = `BIN-${i.toString().padStart(3, '0')}`;
            try {
                const loc = await inventory.useCases.createLocation.execute(tenantId, { warehouseId: wh.id, code, type: 'BIN' });
                locationIds.push(loc.id);
            } catch (e) {
                const all = await inventory.repositories.location.findByWarehouseId(tenantId, wh.id);
                const found = all.find(l => l.code === code);
                if (found) locationIds.push(found.id);
            }
        }
    }

    // 3. Initial Stock (Spread across locations)
    Log.info('Distributing initial stock...');
    const totalOps = products.length;
    let ops = 0;

    for (const p of products) {
        const loc = Random.element(locationIds);
        const qty = Random.int(100, 1000);
        // Robust reception call via Use Case Interface
        await inventory.useCases.receiveStockRobust.execute(tenantId, {
            productId: p.id,
            locationId: loc,
            quantity: qty,
            batchId: `INITIAL-${Random.int(2022, 2023)}-${Random.int(1, 12)}`, // Old stock
            reason: 'Initial Load'
        });
        ops++;
        Log.progress(ops, totalOps);
    }

    Log.success('Inventory seeded');
    return locationIds;
};
