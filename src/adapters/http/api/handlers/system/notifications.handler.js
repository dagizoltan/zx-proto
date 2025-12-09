export const subscribeNotificationsHandler = async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const system = c.ctx.get('domain.system');

  // SSE Header setup is handled by Hono stream helper usually, but here we return a Response directly or use stream helper.
  // The service returns a ReadableStream.
  const stream = system.useCases.notifications.subscribe(tenantId);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
};

export const listNotificationsHandler = async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const system = c.ctx.get('domain.system');
  const cursor = c.req.query('cursor');
  const limit = 20;

  // Filter by user?
  // Ideally yes, user should only see their own notifications or global ones.
  // For now, let's filter by userId matches OR is null (global).
  // The repo handles this logic.

  const result = await system.useCases.notifications.list(tenantId, {
    limit,
    cursor,
    userId: user.id
  });

  return c.json(result);
};

export const markNotificationReadHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const id = c.req.param('id');
  const system = c.ctx.get('domain.system');

  const result = await system.useCases.notifications.markAsRead(tenantId, id);
  if (!result) return c.json({ error: 'Notification not found' }, 404);

  return c.json(result);
};
