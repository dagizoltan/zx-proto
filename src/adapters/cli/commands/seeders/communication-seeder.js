import { Random } from './utils.js';

export const seedCommunication = async (ctx, tenantId, users) => {
    console.log('🌱 Seeding Communication Data...');
    const comms = ctx.get('domain.communication');
    const { postFeedItem, sendMessage, notifications } = comms.useCases;

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

    // --- Seed Conversations ---
    // Use real users if available, otherwise fallbacks
    const userEmails = users && users.length > 0 ? users.map(u => u.email) : ['admin@test.com', 'manager@test.com', 'user@test.com'];
    const getRandomUser = () => Random.element(userEmails);

    const conversationsData = [
        {
            from: 'system',
            to: 'all',
            content: 'Hello everyone! Please check the new feed.'
        },
        {
            from: userEmails[0],
            to: userEmails[1] || 'manager@test.com',
            content: 'Can you review the latest Q3 report?'
        }
    ];

    // Create some threads
    for (const conv of conversationsData) {
        // Start conversation
        const res = await sendMessage(tenantId, conv);
        // Note: useCases return Results (ok/value)
        if (!res || !res.ok) continue;
        const msg = res.value;

        // Add a reply to the first one for demo
        if (conv.from === userEmails[0]) {
            await sendMessage(tenantId, {
                conversationId: msg.conversationId,
                from: conv.to,
                content: 'Sure, I will take a look this afternoon.'
            });
            await sendMessage(tenantId, {
                conversationId: msg.conversationId,
                from: conv.from,
                content: 'Thanks, let me know if you spot any issues.'
            });
        }
    }

    // Generate more random conversations
    for (let i = 0; i < 8; i++) {
        const user1 = getRandomUser();
        let user2 = getRandomUser();
        while (user2 === user1 && userEmails.length > 1) {
            user2 = getRandomUser();
        }

        const res = await sendMessage(tenantId, {
            from: user1,
            to: user2,
            content: `Hey ${user2}, update on project phase ${i}?`
        });

        if (res && res.ok) {
            const msg = res.value;
            // Random replies
            if (i % 2 === 0) {
                 await sendMessage(tenantId, {
                    conversationId: msg.conversationId,
                    from: user2,
                    content: `Working on it, ${user1}. Will accept PR shortly.`
                });
            }
        }
    }

    // --- Seed Notifications ---
    // Note: notification-seeder.js also exists. This adds communication-specific notifications.
    const notifs = [
        { level: 'INFO', title: 'System Update', message: 'Version 2.0 is live.' },
        { level: 'WARN', title: 'Low Stock', message: 'Product X is running low.', link: '/ims/inventory' },
        ...Array.from({ length: 5 }).map((_, i) => ({
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
