import { Random, Log, Time, faker } from './utils.js';
import { isErr } from '../../../../../lib/trust/index.js';

export const seedOrders = async (ctx, tenantId, products, customers) => {
    Log.step('Seeding Sales History (Orders & Shipments)');
    const orders = ctx.get('domain.orders');

    if (!orders) {
        Log.error('Orders domain not found in context');
        return;
    }

    // Identify Admin User (assuming they are in the passed 'customers' list, which is actually 'allUsers' from seed-data.js now)
    // Note: seed-data.js passes 'customers' to seedOrders currently.
    // We need to check if 'admin' is in 'customers' or if we need to pass 'allUsers'.
    // Let's assume we will update seed-data.js to pass allUsers or handle it there.
    // Checking the variable passed: In previous step `seedOrders(ctx, tenantId, products, customers);`
    // I need to ensure `customers` includes the admin if I want to seed orders for them.
    // Wait, usually admins DON'T place orders. But for demo purposes, if the UI shows "My Orders", we need it.

    // I'll filter for the admin user if present.
    const adminUser = customers.find(u => u.email === 'admin@imsshop.com');

    const totalOrders = 500;
    Log.info(`Simulating ${totalOrders} orders over 12 months...`);

    let ops = 0;
    for (let i = 0; i < totalOrders; i++) {
        const date = faker.date.past({ years: 1 });

        // 5% chance it's the admin, otherwise random customer
        let customer;
        if (adminUser && Math.random() < 0.05) {
            customer = adminUser;
        } else {
            customer = Random.element(customers);
        }

        const numItems = Random.int(1, 5);
        const items = [];
        for (let j = 0; j < numItems; j++) {
            const p = Random.element(products);
            items.push({ productId: p.id, quantity: Random.int(1, 3) });
        }

        try {
            const res = await orders.useCases.createOrder.execute(tenantId, customer.id, items);
            if (isErr(res)) continue;

            const order = res.value;

            // Patch Date
            order.createdAt = date.toISOString();
            await orders.repositories.order.save(tenantId, order);

            const r = Math.random();
            if (r > 0.05) { // 95% not cancelled
                await orders.useCases.updateOrderStatus.execute(tenantId, order.id, 'PAID');

                if (r > 0.10) { // 90% shipped
                    const carrier = faker.helpers.arrayElement(['UPS', 'FedEx', 'USPS', 'DHL']);
                    const tracking = faker.string.alphanumeric(12).toUpperCase();

                    await orders.useCases.createShipment.execute(tenantId, {
                        orderId: order.id, items: order.items, carrier: carrier, trackingNumber: tracking
                    });

                    if (r > 0.15) { // 85% delivered
                         await orders.useCases.updateOrderStatus.execute(tenantId, order.id, 'DELIVERED');
                    }
                }
            } else {
                await orders.useCases.updateOrderStatus.execute(tenantId, order.id, 'CANCELLED');
            }
        } catch (e) {
            // Ignore
        }

        ops++;
        Log.progress(ops, totalOrders);
    }

    Log.success('Sales history seeded');
};
