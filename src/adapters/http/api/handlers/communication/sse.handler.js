export const sseHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const { notifications } = c.ctx.get('domain.communication').useCases;

    const stream = notifications.subscribe(tenantId, user.id);

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
};
