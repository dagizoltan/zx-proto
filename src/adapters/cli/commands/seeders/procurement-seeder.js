import { Random, Log, Time, faker } from './utils.js';

export const seedProcurement = async (ctx, tenantId, products, locationIds) => {
    Log.step('Seeding Procurement (Suppliers, Purchase Orders)');
    const procurement = ctx.get('domain.procurement');

    // 1. Procurement: Suppliers (Realistic)
    const suppliers = [];
    const supplierCount = 8;
    for (let i = 0; i < supplierCount; i++) {
        const companyName = faker.company.name();
        const code = `SUP-${faker.string.alphanumeric(4).toUpperCase()}`;

        const res = await procurement.useCases.createSupplier.execute(tenantId, {
            name: companyName,
            code: code,
            email: `contact@${faker.internet.domainName()}`
        });

        if (res.ok) {
            suppliers.push(res.value);
        } else {
            // Fallback: list and find by name (approximate)
            const allRes = await procurement.useCases.listSuppliers.execute(tenantId);
            if (allRes.ok) {
                // If collision, just pick one
                if (allRes.value.items.length > 0) suppliers.push(Random.element(allRes.value.items));
            }
        }
    }

    // Use existing products as materials
    const rawMats = products.filter(p => p.type === 'SIMPLE').slice(0, 50);

    // 2. POs
    Log.info('Creating Historical POs...');
    for (let i = 0; i < 30; i++) {
        const supplier = Random.element(suppliers);
        if (!supplier) continue;

        const date = faker.date.past();

        // Create PO with random raw materials
        const numItems = Random.int(1, 5);
        const poItems = [];
        for(let j=0; j<numItems; j++) {
            const rm = Random.element(rawMats);
            poItems.push({ productId: rm.id, quantity: Random.int(100, 1000), unitCost: parseFloat(faker.commerce.price({ min: 1, max: 50 })) });
        }

        const poRes = await procurement.useCases.createPurchaseOrder.execute(tenantId, {
            supplierId: supplier.id,
            items: poItems,
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
