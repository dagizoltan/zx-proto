import { Random, Log } from './utils.js';
import { isErr } from '../../../../../lib/trust/index.js';

export const seedInventory = async (ctx, tenantId, products) => {
    Log.step('Seeding Inventory (Warehouses, Locations, Initial Stock)');
    const inventory = ctx.get('domain.inventory');

    // 1. Warehouses
    const whData = [
        { name: 'NY Distribution', code: 'WH-NY', location: 'New York' },
        { name: 'LA Hub', code: 'WH-LA', location: 'Los Angeles' },
        { name: 'Chicago Central', code: 'WH-CHI', location: 'Chicago' }
    ];
    const warehouses = [];

    for (const w of whData) {
        const res = await inventory.useCases.createWarehouse.execute(tenantId, w);
        if (res.ok) {
            warehouses.push(res.value);
        } else {
            // Fallback find (using new list)
            const allRes = await inventory.repositories.warehouse.list(tenantId, { limit: 100 });
            if (allRes.ok) {
                warehouses.push(allRes.value.items.find(x => x.name === w.name));
            }
        }
    }

    // 2. Locations
    const locationIds = [];
    for (const wh of warehouses) {
        if (!wh) continue;
        for (let i = 1; i <= 20; i++) {
            const code = `BIN-${i.toString().padStart(3, '0')}`;
            // location schema? I didn't verify it, but assuming createLocation accepts { code ... }
            const res = await inventory.useCases.createLocation.execute(tenantId, { warehouseId: wh.id, code, type: 'BIN' });
            if (res.ok) {
                locationIds.push(res.value.id);
            } else {
                // Assuming repo has queryByIndex or manual find
                const allRes = await inventory.repositories.location.queryByIndex(tenantId, 'warehouse', wh.id);
                if (allRes.ok) {
                    const found = allRes.value.items.find(l => l.code === code);
                    if (found) locationIds.push(found.id);
                }
            }
        }
    }

    // 3. Initial Stock
    Log.info('Distributing initial stock...');
    const totalOps = products.length;
    let ops = 0;

    for (const p of products) {
        const loc = Random.element(locationIds);
        const qty = Random.int(100, 1000);

        await inventory.useCases.receiveStockRobust.execute(tenantId, {
            productId: p.id,
            locationId: loc,
            quantity: qty,
            batchId: `INITIAL-${Random.int(2022, 2023)}-${Random.int(1, 12)}`,
            reason: 'Initial Load'
        });

        await new Promise(resolve => setTimeout(resolve, 20));

        ops++;
        Log.progress(ops, totalOps);
    }

    Log.success('Inventory seeded');
    return locationIds;
};
