import { Random, Log, faker } from './utils.js';
import { unwrap, isErr } from '@lib/trust/index.js';

export const seedManufacturing = async (ctx, tenantId, products) => {
    Log.step('Seeding Manufacturing (BOMs, WorkOrders)');
    const manufacturing = ctx.get('domain.manufacturing');

    // 1. Create BOMs
    const manufacturedProducts = products.filter(p => p.type === 'SIMPLE').slice(0, 20);
    const rawMaterials = products.filter(p => p.type === 'SIMPLE').slice(20, 100);

    const boms = [];

    for (const product of manufacturedProducts) {
        // Create BOM
        const components = [];
        const numComponents = Random.int(2, 5);
        for (let i = 0; i < numComponents; i++) {
            const material = Random.element(rawMaterials);
            components.push({
                productId: material.id,
                quantity: Random.int(1, 10)
            });
        }

        const res = await manufacturing.useCases.createBOM.execute(tenantId, {
            name: `Assembly: ${product.name}`,
            productId: product.id,
            laborCost: parseFloat(faker.commerce.price({ min: 10, max: 100 })),
            components
        });

        if (res.ok) {
            boms.push(res.value);
        }
    }

    Log.info(`Created ${boms.length} BOMs`);

    // 2. Create Work Orders
    const workOrders = [];
    for (let i = 0; i < 40; i++) {
        const bom = Random.element(boms);

        const res = await manufacturing.useCases.createWorkOrder.execute(tenantId, {
            bomId: bom.id,
            quantity: Random.int(10, 100),
            startDate: faker.date.recent({ days: 30 }).toISOString(),
            code: `WO-${faker.string.numeric(6)}`
        });

        if (res.ok) {
            workOrders.push(res.value);
        }
    }

    Log.success(`Seeding Manufacturing Complete: ${boms.length} BOMs, ${workOrders.length} Work Orders`);
};
