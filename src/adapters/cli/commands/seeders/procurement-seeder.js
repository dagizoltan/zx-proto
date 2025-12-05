import { Random, Log, Time } from './utils.js';

export const seedProcurementAndManufacturing = async (ctx, tenantId, locationIds) => {
    Log.step('Seeding Procurement & Manufacturing');
    const procurement = ctx.get('domain.procurement');
    const manufacturing = ctx.get('domain.manufacturing');
    const catalog = ctx.get('domain.catalog');
    const inventory = ctx.get('domain.inventory');

    // 1. Procurement: Suppliers & Raw Materials
    const suppliers = [];
    for (let i = 0; i < 5; i++) {
        try {
            const s = await procurement.useCases.createSupplier.execute(tenantId, { name: `Supplier ${i}`, code: `SUP-${i}`, email: `sup${i}@test.com` });
            suppliers.push(s);
        } catch (e) {
            const all = await procurement.useCases.listSuppliers.execute(tenantId);
            suppliers.push(all.items.find(x => x.code === `SUP-${i}`));
        }
    }

    const rawMats = [];
    for (let i = 0; i < 5; i++) {
        try {
            const rm = await catalog.useCases.createProduct.execute(tenantId, {
                sku: `RM-${i}`, name: `Raw Material ${i}`, price: 5, type: 'SIMPLE', category: 'Materials'
            });
            rawMats.push(rm);
        } catch (e) {
             const all = await catalog.useCases.listProducts.execute(tenantId, 1, 1000); // expensive fetch, optimize in real app
             rawMats.push(all.find(x => x.sku === `RM-${i}`));
        }
    }

    // 2. Purchase Orders (History)
    Log.info('Creating Historical POs...');
    for (let i = 0; i < 20; i++) {
        const supplier = Random.element(suppliers);
        if (!supplier) continue;

        const date = Time.monthsAgo(Random.int(1, 12));
        try {
            const po = await procurement.useCases.createPurchaseOrder.execute(tenantId, {
                supplierId: supplier.id,
                items: rawMats.map(rm => ({ productId: rm.id, quantity: Random.int(500, 2000), unitCost: 4 })),
                expectedDate: Time.addDays(date, 7).toISOString(),
                createdAt: date.toISOString() // Assuming use case respects overrides or we patch entity
            });

            // Receive
            const loc = Random.element(locationIds);
            await procurement.useCases.receivePurchaseOrder.execute(tenantId, po.id, {
                locationId: loc,
                items: po.items.map(pi => ({ productId: pi.productId, quantity: pi.quantity }))
            });
        } catch (e) {}
    }

    // 3. Manufacturing: BOM & WO
    // Define a Finished Good that needs Raw Materials
    let finishedGood;
    try {
        finishedGood = await catalog.useCases.createProduct.execute(tenantId, {
            sku: 'FG-WIDGET', name: 'Manufactured Widget', price: 100, type: 'SIMPLE', category: 'Finished Goods'
        });
    } catch(e) {
        const all = await catalog.useCases.listProducts.execute(tenantId, 1, 1000);
        finishedGood = all.find(x => x.sku === 'FG-WIDGET');
    }

    if (finishedGood && rawMats.length >= 2) {
        try {
            const bom = await manufacturing.useCases.createBOM.execute(tenantId, {
                name: 'Widget BOM', productId: finishedGood.id, laborCost: 10,
                components: [ { productId: rawMats[0].id, quantity: 2 }, { productId: rawMats[1].id, quantity: 1 } ]
            });

            // Create 10 Historical WOs (Completed)
            for (let i = 0; i < 10; i++) {
                const date = Time.monthsAgo(Random.int(1, 6));
                const wo = await manufacturing.useCases.createWorkOrder.execute(tenantId, {
                    bomId: bom.id, quantity: Random.int(10, 50), startDate: date.toISOString()
                });

                // Complete
                const loc = Random.element(locationIds);
                await manufacturing.useCases.completeWorkOrder.execute(tenantId, wo.id, {
                    locationId: loc, inputLocationId: loc, userId: 'system' // simplistic: same loc
                });
            }
        } catch(e) {}
    }

    Log.success('Procurement & Manufacturing history seeded');
};
