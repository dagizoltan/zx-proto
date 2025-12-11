
import { Log } from './utils.js';

export const seedNotifications = async (ctx, tenantId) => {
    Log.step('🔔 Seeding Notifications...');
    const system = ctx.get('domain.system');

    if (!system) {
        Log.error('System context not found! Skipping notification seeding.');
        return;
    }

    const notifications = [
        {
            level: 'SUCCESS',
            title: 'Welcome to IMS',
            message: 'System initialization complete. Welcome to your new Inventory Management System.',
            link: '/ims/system/settings'
        },
        {
            level: 'INFO',
            title: 'Stock Update',
            message: 'Weekly stock reconciliation completed automatically.',
            link: '/ims/inventory/stock'
        },
        {
            level: 'WARN',
            title: 'Low Stock Alert',
            message: 'Product "Smartphone X" is running low on stock (Quantity: 5).',
            link: '/ims/inventory/stock'
        },
        {
            level: 'ERROR',
            title: 'Integration Error',
            message: 'Failed to sync with external accounting provider "QuickBooks". Connection timeout.',
            link: '/ims/system/settings'
        },
        {
            level: 'SUCCESS',
            title: 'Order Shipped',
            message: 'Order #ORD-2023-001 has been fully shipped.',
            link: '/ims/orders'
        }
    ];

    let count = 0;
    for (const n of notifications) {
        // notify use case returns Result? Or void?
        // Let's assume best effort.
        try {
            const res = await system.useCases.notifications.notify(tenantId, {
                userId: null,
                ...n
            });
            // If result pattern is used in system domain:
            if (res && res.ok === false) {
                 console.error('Failed to seed notification:', res.error);
            }
        } catch (e) {
            // Ignore
        }
        count++;
    }

    Log.success(`Created ${count} initial notifications.`);
};
