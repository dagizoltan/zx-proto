import { Log, faker } from './utils.js';

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
        ...Array.from({ length: 15 }).map(() => ({
            level: faker.helpers.arrayElement(['INFO', 'WARN', 'ERROR', 'SUCCESS']),
            title: faker.hacker.verb() + ' ' + faker.hacker.noun(),
            message: faker.hacker.phrase(),
            link: '/ims/dashboard'
        }))
    ];

    let count = 0;
    for (const n of notifications) {
        try {
            const res = await system.useCases.notifications.notify(tenantId, {
                userId: null,
                ...n
            });
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
