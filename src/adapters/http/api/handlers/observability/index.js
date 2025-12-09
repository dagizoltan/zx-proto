export const listLogsHandler = async (c) => {
    const { listLogs } = c.ctx.get('domain.observability').useCases;
    const { level, cursor, limit } = c.req.query();

    // Default level if not provided? Or maybe allow 'all' if we support it later.
    // For now, strict level.
    const queryLevel = level || 'INFO';
    const queryLimit = limit ? parseInt(limit) : 50;

    const result = await listLogs.execute(c.get('tenantId'), {
        level: queryLevel,
        cursor,
        limit: queryLimit
    });

    return c.json(result);
};

export const listActivityLogsHandler = async (c) => {
    const { listActivityLogs } = c.ctx.get('domain.observability').useCases;
    const { cursor, limit } = c.req.query();
    const queryLimit = limit ? parseInt(limit) : 50;

    const result = await listActivityLogs.execute(c.get('tenantId'), {
        cursor,
        limit: queryLimit
    });

    return c.json(result);
};

export const listAuditLogsHandler = async (c) => {
    const { listAuditLogs } = c.ctx.get('domain.observability').useCases;
    const { cursor, limit } = c.req.query();
    const queryLimit = limit ? parseInt(limit) : 50;

    const result = await listAuditLogs.execute(c.get('tenantId'), {
        cursor,
        limit: queryLimit
    });

    return c.json(result);
};
