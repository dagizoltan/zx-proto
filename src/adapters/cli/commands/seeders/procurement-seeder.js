import { Random, Log, Time } from './utils.js';

export const seedProcurement = async (ctx, tenantId, products, locationIds) => {
    Log.step('Seeding Procurement (Suppliers, Purchase Orders)');
    const procurement = ctx.get('domain.procurement');

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

    // Use existing products as materials
    const rawMats = products.filter(p => p.type === 'SIMPLE').slice(0, 20);

    // 2. POs
    Log.info('Creating Historical POs...');
    for (let i = 0; i < 20; i++) {
        const supplier = Random.element(suppliers);
        if (!supplier) continue;

        const date = Time.monthsAgo(Random.int(1, 12));

        // Create PO with random raw materials
        const poRes = await procurement.useCases.createPurchaseOrder.execute(tenantId, {
            supplierId: supplier.id,
            items: rawMats.map(rm => ({ productId: rm.id, quantity: Random.int(500, 2000), unitCost: 4 })),
            expectedDate: Time.addDays(date, 7).toISOString(),
            createdAt: date.toISOString()
        });

        if (poRes.ok) {
            const po = poRes.value;
            const loc = Random.element(locationIds);

            // Receive PO
            await procurement.useCases.receivePurchaseOrder.execute(tenantId, po.id, {
                locationId: loc,
                items: po.items.map(pi => ({ productId: pi.productId, quantity: pi.quantity }))
            });
        }
    }

    Log.success('Procurement history seeded');
};
