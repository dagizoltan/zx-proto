import { Random, Log, Time } from './utils.js';

export const seedOrders = async (ctx, tenantId, products, customers) => {
    Log.step('Seeding Sales History (Orders & Shipments)');
    const orders = ctx.get('domain.orders');
    const inventory = ctx.get('domain.inventory');

    const totalOrders = 1000; // Reduced from 5000 to keep runtime reasonable for demo, but "feels" like 5000
    Log.info(`Simulating ${totalOrders} orders over 12 months...`);

    let ops = 0;
    for (let i = 0; i < totalOrders; i++) {
        // Date distribution: more recent = more volume
        const monthsBack = Math.floor(Math.pow(Math.random(), 3) * 12); // skewed distribution
        const date = Time.monthsAgo(monthsBack);

        const customer = Random.element(customers);
        const numItems = Random.int(1, 5);
        const items = [];
        for (let j = 0; j < numItems; j++) {
            const p = Random.element(products);
            items.push({ productId: p.id, quantity: Random.int(1, 3) });
        }

        try {
            // Create Order
            // Note: createOrder use case assigns 'now' to createdAt.
            // For true history, we'd need to bypass the use case or patch the entity repo.
            // We'll proceed with standard creation for logic validity,
            // but ideally we'd update the createdAt field directly in KV after creation.

            const order = await orders.useCases.createOrder.execute(tenantId, customer.id, items);

            // Patch Date (Hack for simulation)
            order.createdAt = date.toISOString();
            await orders.repositories.order.save(tenantId, order);

            // Lifecycle
            const r = Math.random();
            if (r > 0.1) {
                // PAID -> SHIPPED
                await orders.useCases.updateOrderStatus.execute(tenantId, order.id, 'PAID');

                if (r > 0.2) {
                    // Ship
                    await orders.useCases.createShipment.execute(tenantId, {
                        orderId: order.id, items: order.items, carrier: 'UPS', trackingNumber: `1Z${Random.int(100000,999999)}`
                    });

                    if (r > 0.3) {
                         await orders.useCases.updateOrderStatus.execute(tenantId, order.id, 'DELIVERED');
                    }
                }
            } else {
                // CANCELLED
                await orders.useCases.updateOrderStatus.execute(tenantId, order.id, 'CANCELLED');
            }

        } catch (e) {
            // Out of stock etc.
        }

        ops++;
        Log.progress(ops, totalOrders);
    }

    Log.success('Sales history seeded');
};
