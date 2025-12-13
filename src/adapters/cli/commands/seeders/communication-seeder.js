import { Random, faker } from './utils.js';

export const seedCommunication = async (ctx, tenantId, users) => {
    console.log('🌱 Seeding Communication Data...');
    const comms = ctx.get('domain.communication');
    const { postFeedItem, sendMessage, notifications } = comms.useCases;

    // --- Seed Feed ---
    const feedItems = [
        {
            channelId: 'general',
            content: 'Welcome to the new IMS system! Please update your profiles.',
            type: 'post',
            authorId: 'admin',
            createdAt: faker.date.recent({ days: 10 }).toISOString()
        },
        ...Array.from({ length: 10 }).map((_, i) => ({
            channelId: 'announcements',
            content: faker.lorem.paragraph(),
            type: 'post',
            authorId: 'admin',
            createdAt: faker.date.recent({ days: 30 }).toISOString()
        })),
        ...Array.from({ length: 15 }).map((_, i) => ({
            channelId: 'system-events',
            content: `System auto-check: ${faker.hacker.phrase()}`,
            type: 'system',
            authorId: 'system',
            createdAt: faker.date.recent({ days: 5 }).toISOString()
        }))
    ];

    for (const item of feedItems) {
        await postFeedItem(tenantId, item);
    }

    // --- Seed Conversations ---
    // Identify Admin
    const adminUser = users.find(u => u.email === 'admin@imsshop.com');

    const userIds = users && users.length > 0 ? users.map(u => u.id) : ['user-1'];
    const getRandomUser = () => Random.element(userIds);

    if (userIds.length > 1) {
        // Generate random conversations
        for (let i = 0; i < 20; i++) {
            let user1 = getRandomUser();
            let user2 = getRandomUser();

            // 30% chance to involve admin
            if (adminUser && Math.random() < 0.3) {
                user1 = adminUser.id;
                // pick user2 distinct from admin
                do {
                    user2 = getRandomUser();
                } while (user2 === user1);
            } else {
                 while (user2 === user1 && userIds.length > 1) user2 = getRandomUser();
            }

            const res = await sendMessage(tenantId, {
                from: user1,
                to: user2,
                content: faker.lorem.sentence()
            });

            if (res && res.ok) {
                const msg = res.value;

                // Add 1-5 replies
                const replies = Random.int(1, 5);
                let lastUser = user2;
                for(let j=0; j<replies; j++) {
                     await sendMessage(tenantId, {
                        conversationId: msg.conversationId,
                        from: lastUser,
                        content: faker.lorem.sentence()
                    });
                    lastUser = lastUser === user1 ? user2 : user1;
                }
            }
        }
    }

    console.log('✅ Communication seeded.');
};
