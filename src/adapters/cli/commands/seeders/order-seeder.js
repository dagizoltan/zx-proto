import { Random, Log, Time, faker } from './utils.js';
import { isErr } from '../../../../../lib/trust/index.js';

export const seedOrders = async (ctx, tenantId, products, customers) => {
    Log.step('Seeding Sales History (Orders & Shipments)');
    const orders = ctx.get('domain.orders');

    // Check if domain exists (it should)
    if (!orders) {
        Log.error('Orders domain not found in context');
        return;
    }

    const totalOrders = 500; // Increased for realism
    Log.info(`Simulating ${totalOrders} orders over 12 months...`);

    let ops = 0;
    for (let i = 0; i < totalOrders; i++) {
        // Better time distribution (more recent)
        const date = faker.date.past({ years: 1 });

        const customer = Random.element(customers);
        const numItems = Random.int(1, 5);
        const items = [];
        for (let j = 0; j < numItems; j++) {
            const p = Random.element(products);
            items.push({ productId: p.id, quantity: Random.int(1, 3) });
        }

        try {
            const res = await orders.useCases.createOrder.execute(tenantId, customer.id, items);
            if (isErr(res)) continue; // Skip on failure

            const order = res.value;

            // Patch Date
            order.createdAt = date.toISOString();
            // .save returns Result
            await orders.repositories.order.save(tenantId, order);

            const r = Math.random();
            if (r > 0.05) { // 95% not cancelled immediately
                await orders.useCases.updateOrderStatus.execute(tenantId, order.id, 'PAID');

                if (r > 0.10) { // 90% shipped
                    const carrier = faker.helpers.arrayElement(['UPS', 'FedEx', 'USPS', 'DHL']);
                    const tracking = faker.string.alphanumeric(12).toUpperCase();

                    await orders.useCases.createShipment.execute(tenantId, {
                        orderId: order.id, items: order.items, carrier: carrier, trackingNumber: tracking
                    });

                    if (r > 0.15) { // 85% delivered
                         await orders.useCases.updateOrderStatus.execute(tenantId, order.id, 'DELIVERED');
                    } else if (r < 0.18) {
                        // 3% Returns
                        // Implement return logic if use case exists, otherwise skip
                        // await orders.useCases.returnOrder.execute(...)
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
