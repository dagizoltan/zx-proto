
export const listAuditLogsHandler = async (c) => {
  const tenantId = c.get('tenantId');
  const system = c.ctx.get('domain.system');
  const query = c.req.query();

  const result = await system.useCases.listAuditLogs.execute(tenantId, {
    limit: query.limit ? parseInt(query.limit) : 50,
    cursor: query.cursor,
    userId: query.userId,
    action: query.action,
    resource: query.resource
  });

  // Transformer needed? Or raw is fine?
  // Let's assume raw is mostly fine but ensuring dates are strings is good.
  // We'll create a simple transformer or return result if no transformer exists yet.
  return c.json(result);
};
