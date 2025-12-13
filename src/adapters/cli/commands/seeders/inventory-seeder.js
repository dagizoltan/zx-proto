import { Random, Log, faker } from './utils.js';
import { isErr } from '../../../../../lib/trust/index.js';

export const seedInventory = async (ctx, tenantId, products) => {
    Log.step('Seeding Inventory (Warehouses, Locations, Initial Stock)');
    const inventory = ctx.get('domain.inventory');

    // 1. Warehouses (Realistic)
    const whData = [
        { name: 'East Coast Distribution', code: 'WH-EAST', location: 'New York, NY' },
        { name: 'West Coast Hub', code: 'WH-WEST', location: 'Los Angeles, CA' },
        { name: 'Central Fulfillment', code: 'WH-CENTRAL', location: 'Chicago, IL' },
        { name: 'European Depot', code: 'WH-EU', location: 'Frankfurt, Germany' }
    ];
    const warehouses = [];

    for (const w of whData) {
        // Enrich with real address if possible, but schema might just be string
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

        // Zones: A, B, C
        for (const zone of ['A', 'B', 'C']) {
            for (let i = 1; i <= 10; i++) {
                // Rack-Shelf-Bin format
                const code = `${zone}-${i.toString().padStart(2, '0')}-${Random.int(1, 4)}`;

                const res = await inventory.useCases.createLocation.execute(tenantId, { warehouseId: wh.id, code, type: 'BIN' });
                if (res.ok) {
                    locationIds.push(res.value.id);
                } else {
                    const allRes = await inventory.repositories.location.queryByIndex(tenantId, 'warehouse', wh.id);
                    if (allRes.ok) {
                        const found = allRes.value.items.find(l => l.code === code);
                        if (found) locationIds.push(found.id);
                    }
                }
            }
        }
    }

    // 3. Initial Stock
    Log.info('Distributing initial stock...');
    const totalOps = products.length;
    let ops = 0;

    for (const p of products) {
        // Distribute stock across multiple locations
        const locations = [];
        for(let i=0; i<Random.int(1, 3); i++) {
            locations.push(Random.element(locationIds));
        }

        for(const loc of locations) {
             const qty = Random.int(50, 500);
             await inventory.useCases.receiveStockRobust.execute(tenantId, {
                productId: p.id,
                locationId: loc,
                quantity: qty,
                batchId: `BATCH-${faker.string.alphanumeric(6).toUpperCase()}`,
                reason: 'Initial Load'
            });
             await new Promise(resolve => setTimeout(resolve, 10));
        }

        ops++;
        Log.progress(ops, totalOps);
    }

    Log.success('Inventory seeded');
    return locationIds;
};
