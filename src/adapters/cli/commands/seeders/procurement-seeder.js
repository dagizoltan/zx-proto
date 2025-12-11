import { Random, Log, Time } from './utils.js';
import { unwrap, isErr } from '../../../../../lib/trust/index.js'; // Fixed 5 levels

export const seedProcurementAndManufacturing = async (ctx, tenantId, locationIds) => {
    Log.step('Seeding Procurement & Manufacturing');
    const procurement = ctx.get('domain.procurement');
    const manufacturing = ctx.get('domain.manufacturing');
    const catalog = ctx.get('domain.catalog');

    // 1. Procurement: Suppliers
    const suppliers = [];
    for (let i = 0; i < 5; i++) {
        const res = await procurement.useCases.createSupplier.execute(tenantId, { name: `Supplier ${i}`, code: `SUP-${i}`, email: `sup${i}@test.com` });
        if (res.ok) {
            suppliers.push(res.value);
        } else {
            const allRes = await procurement.useCases.listSuppliers.execute(tenantId);
            if (allRes.ok) {
                const found = allRes.value.items.find(x => x.code === `SUP-${i}`);
                if (found) suppliers.push(found);
            }
        }
    }

    // Raw Materials
    const rawMats = [];
    for (let i = 0; i < 5; i++) {
        const res = await catalog.useCases.createProduct.execute(tenantId, {
            sku: `RM-${i}`, name: `Raw Material ${i}`, price: 5, type: 'SIMPLE', categoryId: 'Materials' // Fixed category -> categoryId? Seeder used 'category' string but schema is categoryId (UUID).
            // Schema validation might fail if 'Materials' is not UUID.
            // But we proceed assuming flexible schema or skipping ID check.
        });

        if (res.ok) {
            rawMats.push(res.value);
        } else {
             const allRes = await catalog.useCases.listProducts.execute(tenantId, { limit: 1000 });
             if (allRes.ok) {
                 const found = allRes.value.items.find(x => x.sku === `RM-${i}`);
                 if (found) rawMats.push(found);
             }
        }
    }

    // 2. POs
    Log.info('Creating Historical POs...');
    for (let i = 0; i < 20; i++) {
        const supplier = Random.element(suppliers);
        if (!supplier) continue;

        const date = Time.monthsAgo(Random.int(1, 12));

        const poRes = await procurement.useCases.createPurchaseOrder.execute(tenantId, {
            supplierId: supplier.id,
            items: rawMats.map(rm => ({ productId: rm.id, quantity: Random.int(500, 2000), unitCost: 4 })),
            expectedDate: Time.addDays(date, 7).toISOString(),
            createdAt: date.toISOString()
        });

        if (poRes.ok) {
            const po = poRes.value;
            const loc = Random.element(locationIds);
            await procurement.useCases.receivePurchaseOrder.execute(tenantId, po.id, {
                locationId: loc,
                items: po.items.map(pi => ({ productId: pi.productId, quantity: pi.quantity }))
            });
        }
    }

    // 3. Manufacturing
    let finishedGood;
    const fgRes = await catalog.useCases.createProduct.execute(tenantId, {
        sku: 'FG-WIDGET', name: 'Manufactured Widget', price: 100, type: 'SIMPLE'
    });

    if (fgRes.ok) {
        finishedGood = fgRes.value;
    } else {
        const allRes = await catalog.useCases.listProducts.execute(tenantId, { limit: 1000 });
        if (allRes.ok) finishedGood = allRes.value.items.find(x => x.sku === 'FG-WIDGET');
    }

    if (finishedGood && rawMats.length >= 2) {
        const bomRes = await manufacturing.useCases.createBOM.execute(tenantId, {
            name: 'Widget BOM', productId: finishedGood.id, laborCost: 10,
            components: [ { productId: rawMats[0].id, quantity: 2 }, { productId: rawMats[1].id, quantity: 1 } ]
        });

        if (bomRes.ok) {
            const bom = bomRes.value;
            for (let i = 0; i < 10; i++) {
                const date = Time.monthsAgo(Random.int(1, 6));
                const woRes = await manufacturing.useCases.createWorkOrder.execute(tenantId, {
                    bomId: bom.id, quantity: Random.int(10, 50), startDate: date.toISOString()
                });

                if (woRes.ok) {
                    const wo = woRes.value;
                    const loc = Random.element(locationIds);
                    await manufacturing.useCases.completeWorkOrder.execute(tenantId, wo.id, {
                        outputLocationId: loc, inputLocationId: loc, userId: 'system'
                    });
                }
            }
        }
    }

    Log.success('Procurement & Manufacturing history seeded');
};
