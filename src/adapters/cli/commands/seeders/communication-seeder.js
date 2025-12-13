import { Random } from './utils.js';

export const seedCommunication = async (ctx, tenantId, users) => {
    console.log('🌱 Seeding Communication Data...');
    const comms = ctx.get('domain.communication');
    const { postFeedItem, sendMessage, notifications } = comms.useCases;

    // --- Seed Feed ---
    const feedItems = [
        {
            channelId: 'general',
            content: 'We have updated the system with a new communication hub and observability tools.',
            type: 'post',
            authorId: 'admin', // Mock ID
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            channelId: 'announcements',
            content: 'System maintenance scheduled for this weekend. Expect downtime from 2 AM to 4 AM UTC.',
            type: 'post',
            authorId: 'admin',
            createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        ...Array.from({ length: 15 }).map((_, i) => ({
            channelId: 'system-events',
            content: `Automated system check completed successfully. Module ${String.fromCharCode(65 + i)} is operational.`,
            type: 'system',
            authorId: 'system',
            createdAt: new Date(Date.now() - 3600000 * (i + 2)).toISOString()
        })),
        {
            channelId: 'hr',
            content: 'Join us for the quarterly town hall meeting next Friday.',
            type: 'post',
            authorId: 'hr-dept',
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
        }
    ];

    for (const item of feedItems) {
        // postFeedItem returns Result, but we ignore here assuming valid data
        await postFeedItem(tenantId, item);
    }

    // --- Seed Conversations ---
    // Use real users if available, otherwise fallbacks
    const userIds = users && users.length > 0 ? users.map(u => u.id) : ['user-1', 'user-2', 'user-3'];
    const getRandomUser = () => Random.element(userIds);

    const conversationsData = [
        {
            from: 'system',
            to: userIds[0] || 'all',
            content: 'Hello everyone! Please check the new feed.'
        },
        {
            from: userIds[0],
            to: userIds[1] || 'user-2',
            content: 'Can you review the latest Q3 report?'
        }
    ];

    // Create some threads
    for (const conv of conversationsData) {
        // Start conversation
        const res = await sendMessage(tenantId, conv);
        // Note: useCases return Results (ok/value)
        if (!res || !res.ok) {
             // console.warn('Failed to seed conversation', res);
             continue;
        }
        const msg = res.value;
        // msg contains conversationId now (from our fix)

        // Add a reply to the first one for demo
        if (conv.from === userIds[0]) {
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
        while (user2 === user1 && userIds.length > 1) {
            user2 = getRandomUser();
        }

        const res = await sendMessage(tenantId, {
            from: user1,
            to: user2,
            content: `Hey, update on project phase ${i}?`
        });

        if (res && res.ok) {
            const msg = res.value;
            // Random replies
            if (i % 2 === 0) {
                 await sendMessage(tenantId, {
                    conversationId: msg.conversationId,
                    from: user2,
                    content: `Working on it. Will accept PR shortly.`
                });
            }
        }
    }

    // --- Seed Notifications ---
    const notifs = [
        { level: 'info', title: 'System Update', message: 'Version 2.0 is live.' },
        { level: 'warning', title: 'Low Stock', message: 'Product X is running low.', link: '/ims/inventory' },
        ...Array.from({ length: 5 }).map((_, i) => ({
            level: ['info', 'success', 'warning'][i % 3],
            title: `Routine Check ${i}`,
            message: `Routine system check ${i} completed. Status: OK.`,
            link: i % 2 === 0 ? '/ims/system/settings' : null
        }))
    ];

    // Assign notifications to random users
    for (const n of notifs) {
        const targetUser = getRandomUser();
        await notifications.notify(tenantId, { ...n, userId: targetUser });
    }

    console.log('✅ Communication seeded.');
};
