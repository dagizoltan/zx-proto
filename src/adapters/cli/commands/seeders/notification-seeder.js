import { Log, faker, Random } from './utils.js';

export const seedNotifications = async (ctx, tenantId, users) => {
    Log.step('🔔 Seeding Notifications...');
    const system = ctx.get('domain.system');

    if (!system) {
        Log.error('System context not found! Skipping notification seeding.');
        return;
    }

    // Identify Admin User
    const adminUser = users.find(u => u.email === 'admin@imsshop.com');
    if (adminUser) {
        Log.info(`Targeting Admin User: ${adminUser.id} (${adminUser.email})`);
    }

    const notifications = [
        {
            level: 'SUCCESS',
            title: 'Welcome to IMS',
            message: 'System initialization complete. Welcome to your new Inventory Management System.',
            link: '/ims/system/settings',
            forceUser: adminUser // Ensure admin sees this
        },
        ...Array.from({ length: 30 }).map(() => ({
            level: faker.helpers.arrayElement(['INFO', 'WARN', 'ERROR', 'SUCCESS']),
            title: faker.hacker.verb() + ' ' + faker.hacker.noun(),
            message: faker.hacker.phrase(),
            link: '/ims/dashboard'
        }))
    ];

    let count = 0;
    for (const n of notifications) {
        try {
            // Priority: Forced User -> Random User (70%) -> System Wide (30%)
            let targetUserId = null;
            if (n.forceUser) {
                targetUserId = n.forceUser.id;
            } else if (adminUser && Math.random() < 0.3) {
                // 30% chance to assign to admin explicitly to populate their list
                targetUserId = adminUser.id;
            } else {
                 const randomUser = Random.bool(0.7) ? Random.element(users) : null;
                 targetUserId = randomUser ? randomUser.id : null;
            }

            const { forceUser, ...data } = n; // Remove helper prop

            const res = await system.useCases.notifications.notify(tenantId, {
                userId: targetUserId,
                ...data
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
