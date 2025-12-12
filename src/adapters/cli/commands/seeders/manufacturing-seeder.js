import { Random, Log } from './utils.js';
import { unwrap, isErr } from '@lib/trust/index.js';

export const seedManufacturing = async (ctx, tenantId, products) => {
    Log.step('Seeding Manufacturing (BOMs, WorkOrders)');
    const manufacturing = ctx.get('domain.manufacturing');

    // 1. Create BOMs
    const manufacturedProducts = products.filter(p => p.type === 'SIMPLE').slice(0, 10);
    const rawMaterials = products.filter(p => p.type === 'SIMPLE').slice(10, 30);

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
            name: `BOM for ${product.name}`,
            productId: product.id,
            laborCost: Random.float(5, 50),
            components
        });

        if (res.ok) {
            boms.push(res.value);
        }
    }

    Log.info(`Created ${boms.length} BOMs`);

    // 2. Create Work Orders
    const workOrders = [];
    for (let i = 0; i < 20; i++) {
        const bom = Random.element(boms);

        const res = await manufacturing.useCases.createWorkOrder.execute(tenantId, {
            bomId: bom.id,
            quantity: Random.int(10, 100),
            startDate: new Date().toISOString(),
            code: `WO-${1000 + i}`
        });

        if (res.ok) {
            workOrders.push(res.value);
        }
    }

    Log.success(`Seeding Manufacturing Complete: ${boms.length} BOMs, ${workOrders.length} Work Orders`);
};
