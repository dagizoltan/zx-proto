import { AuditLog } from '../../../../ctx/system/domain/audit-log.js';

export const auditMiddleware = async (c, next) => {
  // Run the handler first
  await next();

  // Post-processing (Fire and Forget)
  try {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const system = c.ctx.get('domain.system');

    // Only audit authenticated requests within a tenant context
    if (!user || !tenantId || !system) return;

    const method = c.req.method;
    const path = c.req.path;

    // Map Method to Action
    let action = 'UNKNOWN';
    if (method === 'GET') action = 'READ';
    if (method === 'POST') action = 'CREATE';
    if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
    if (method === 'DELETE') action = 'DELETE';

    // Parse Resource (e.g. /catalogs/products/123 -> products)
    // Path structure: /catalogs/products or /orders
    const segments = path.split('/').filter(Boolean);
    // segments[0] might be 'catalogs', 'orders', etc. (Mapped via App.js)
    // segments[1] might be resource if segments[0] is domain.
    // Let's use the full path for now as resource identifier.
    const resource = path;
    const resourceId = segments[segments.length - 1]; // Naive ID extraction

    // Capture changes for Write ops?
    // Accessing body here might be tricky if already consumed and not cached.
    // Hono validator middleware usually stores parsed data in c.get('validatedData').
    const details = c.get('validatedData') || {};

    const log = AuditLog({
      id: crypto.randomUUID(),
      tenantId,
      userId: user.id,
      userEmail: user.email,
      action,
      resource,
      resourceId,
      details,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      userAgent: c.req.header('user-agent')
    });

    // Save asynchronously
    system.repositories.audit.save(tenantId, log).catch(err => {
      console.error('Failed to save audit log', err);
    });

  } catch (e) {
    console.error('Audit Middleware Error', e);
  }
};
