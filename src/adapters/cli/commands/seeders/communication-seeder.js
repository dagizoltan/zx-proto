// Communication Seeder
export const seedCommunication = async (tenantId, { postFeedItem, sendMessage, notifications }) => {
    console.log('🌱 Seeding Communication Data...');

    // --- Seed Feed ---
    const feedItems = [
        {
            title: 'Welcome to the New System',
            message: 'We have updated the system with a new communication hub and observability tools.',
            type: 'MANUAL',
            author: 'Admin',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            title: 'Maintenance Scheduled',
            message: 'System maintenance scheduled for this weekend. Expect downtime from 2 AM to 4 AM UTC.',
            type: 'MANUAL',
            author: 'IT Dept',
            createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        // Generate more random feed items
        ...Array.from({ length: 15 }).map((_, i) => ({
            title: `System Event #${i + 1}`,
            message: `Automated system check completed successfully. Module ${String.fromCharCode(65 + i)} is operational.`,
            type: 'SYSTEM',
            author: 'System',
            createdAt: new Date(Date.now() - 3600000 * (i + 2)).toISOString()
        })),
        {
            title: 'Quarterly Town Hall',
            message: 'Join us for the quarterly town hall meeting next Friday.',
            type: 'MANUAL',
            author: 'HR',
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
        }
    ];

    for (const item of feedItems) {
        await postFeedItem(tenantId, item);
    }

    // --- Seed Messages ---
    const messagesData = [
        {
            from: 'system',
            to: 'all',
            content: 'Hello everyone! Please check the new feed.'
        },
        {
            from: 'admin',
            to: 'manager',
            content: 'Can you review the latest Q3 report?'
        },
        {
            from: 'support',
            to: 'admin',
            content: 'Customer #420 is requesting a refund.'
        },
        ...Array.from({ length: 8 }).map((_, i) => ({
            from: i % 2 === 0 ? 'alice' : 'bob',
            to: 'team',
            content: `Update on project phase ${i}: We are making good progress.`
        }))
    ];

    for (const msg of messagesData) {
        await sendMessage(tenantId, msg);
    }

    // --- Seed Notifications ---
    const notifs = [
        { level: 'INFO', title: 'System Update', message: 'Version 2.0 is live.' },
        { level: 'WARN', title: 'Low Stock', message: 'Product X is running low.', link: '/ims/inventory' },
        { level: 'SUCCESS', title: 'Backup Complete', message: 'Daily backup finished successfully.' },
        { level: 'ERROR', title: 'Failed Login', message: 'Multiple failed login attempts detected from IP 192.168.1.100' },
        ...Array.from({ length: 12 }).map((_, i) => ({
            level: ['INFO', 'SUCCESS', 'WARN'][i % 3],
            title: `Routine Check ${i}`,
            message: `Routine system check ${i} completed. Status: OK.`,
            link: i % 2 === 0 ? '/ims/system/settings' : null
        }))
    ];

    for (const n of notifs) {
        await notifications.notify(tenantId, n);
    }

    console.log('✅ Communication seeded.');
};
