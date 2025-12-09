// Communication Seeder
export const seedCommunication = async (tenantId, { postFeedItem, sendMessage, notifications }) => {
    console.log('🌱 Seeding Communication Data...');

    // Seed Feed
    const feedItems = [
        {
            title: 'Welcome to the New System',
            message: 'We have updated the system with a new communication hub and observability tools.',
            type: 'MANUAL',
            author: 'Admin',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
        },
        {
            title: 'Maintenance Scheduled',
            message: 'System maintenance scheduled for this weekend.',
            type: 'MANUAL',
            author: 'IT Dept',
            createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        }
    ];

    for (const item of feedItems) {
        // Was feed.postItem, now postFeedItem
        await postFeedItem(tenantId, item);
    }

    // Seed Messages
    // Assuming we have a user 'admin' (usually ID is unknown here without lookup, but we can fake interactions or skip)
    // We'll skip specific user-to-user messages for now unless we look up IDs,
    // or we can create a broadcast message.

    // Was messages.sendMessage, now sendMessage
    await sendMessage(tenantId, {
        from: 'system',
        to: 'all',
        content: 'Hello everyone! Please check the new feed.'
    });

    // Seed Notifications
    const notifs = [
        { level: 'INFO', title: 'System Update', message: 'Version 2.0 is live.' },
        { level: 'WARN', title: 'Low Stock', message: 'Product X is running low.', link: '/ims/inventory' },
        { level: 'SUCCESS', title: 'Backup Complete', message: 'Daily backup finished successfully.' }
    ];

    for (const n of notifs) {
        await notifications.notify(tenantId, n);
    }

    console.log('✅ Communication seeded.');
};
