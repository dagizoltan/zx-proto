// Placeholder for API handlers if needed
// For now, let's keep it minimal as UI was the primary driver
export const listFeedHandler = async (c) => {
    const { getFeed } = c.ctx.get('domain.communication').useCases;
    const { cursor, limit } = c.req.query();
    const result = await getFeed(c.get('tenantId'), { cursor, limit: limit ? parseInt(limit) : 20 });
    return c.json(result);
};

export const listMessagesHandler = async (c) => {
    const { listMessages } = c.ctx.get('domain.communication').useCases;
    const { cursor, limit } = c.req.query();
    const result = await listMessages(c.get('tenantId'), { cursor, limit: limit ? parseInt(limit) : 20 });
    return c.json(result);
};

export const listNotificationsHandler = async (c) => {
    const { notifications } = c.ctx.get('domain.communication').useCases;
    const user = c.get('user');
    const { cursor, limit } = c.req.query();

    // Pass userId to filter notifications for the current user
    const result = await notifications.list(c.get('tenantId'), {
        userId: user ? user.id : null,
        cursor,
        limit: limit ? parseInt(limit) : 50
    });
    return c.json(result);
};

export * from './sse.handler.js';
