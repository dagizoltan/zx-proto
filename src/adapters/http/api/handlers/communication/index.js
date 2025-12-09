// Placeholder for API handlers if needed
// For now, let's keep it minimal as UI was the primary driver
export const listFeedHandler = async (c) => {
    const { getFeed } = c.ctx.communication.useCases;
    const { cursor, limit } = c.req.query();
    const result = await getFeed(c.get('tenantId'), { cursor, limit: limit ? parseInt(limit) : 20 });
    return c.json(result);
};

export const listMessagesHandler = async (c) => {
    const { listMessages } = c.ctx.communication.useCases;
    const { cursor, limit } = c.req.query();
    const result = await listMessages(c.get('tenantId'), { cursor, limit: limit ? parseInt(limit) : 20 });
    return c.json(result);
};

export const listNotificationsHandler = async (c) => {
    const { notifications } = c.ctx.communication.useCases;
    const { cursor, limit } = c.req.query();
    const result = await notifications.list(c.get('tenantId'), { cursor, limit: limit ? parseInt(limit) : 50 });
    return c.json(result);
};
