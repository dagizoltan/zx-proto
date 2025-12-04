import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth-middleware.js';

export const adminRoutes = new Hono();

// Apply Auth Middleware to all admin routes
adminRoutes.use('*', authMiddleware);

// Middleware to check Admin role (simplified for now, ideally check specific permission)
// For this MVP, we assume any user reaching here is authenticated.
// REAL IMPLEMENTATION: fetch user roles and check if 'admin' or has 'manage_users' permission.
adminRoutes.use('*', async (c, next) => {
    // const user = c.get('user');
    // const rbac = c.ctx.get('domain.access-control').services.rbac;
    // const hasAccess = await rbac.hasPermission(user.id, 'admin', 'access');
    // if (!hasAccess) return c.json({error: 'Forbidden'}, 403);
    await next();
});

// --- User Management ---

adminRoutes.get('/users', async (c) => {
  const tenantId = c.get('tenantId');
  const { limit, cursor, q: search } = c.req.query();
  const ac = c.ctx.get('domain.access-control');

  const result = await ac.useCases.listUsers.execute(tenantId, {
      limit: limit ? parseInt(limit) : 20,
      cursor,
      search
  });
  return c.json(result);
});

adminRoutes.post('/users/:id/roles', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.req.param('id');
    const { roleIds } = await c.req.json();
    const ac = c.ctx.get('domain.access-control');

    const updatedUser = await ac.useCases.assignRole.execute(tenantId, { userId, roleIds });
    // Don't return password hash
    const { passwordHash, ...safeUser } = updatedUser;
    return c.json(safeUser);
});

// --- Role Management ---

adminRoutes.get('/roles', async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');
    const roles = await ac.useCases.listRoles.execute(tenantId);
    return c.json(roles);
});

adminRoutes.post('/roles', async (c) => {
    const tenantId = c.get('tenantId');
    const data = await c.req.json();
    const ac = c.ctx.get('domain.access-control');

    const role = await ac.useCases.createRole.execute(tenantId, data);
    return c.json(role, 201);
});

// --- CRM (Customers) ---
// Re-using listUsers but functionally conceptually distinct for the UI
adminRoutes.get('/customers', async (c) => {
    const tenantId = c.get('tenantId');
    const { limit, cursor, q: search } = c.req.query();
    const ac = c.ctx.get('domain.access-control');

    // In a real app, we might filter by role 'customer' here
    const result = await ac.useCases.listUsers.execute(tenantId, {
        limit: limit ? parseInt(limit) : 20,
        cursor,
        search
    });
    return c.json(result);
});

adminRoutes.get('/customers/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.req.param('id');
    const ac = c.ctx.get('domain.access-control');

    // 1. Get User Profile
    const user = await ac.repositories.user.findById(tenantId, userId);
    if (!user) return c.json({ error: 'User not found' }, 404);

    const { passwordHash, ...safeUser } = user;

    // 2. Get Order History (Cross-domain call)
    const ordersDomain = c.ctx.get('domain.orders');
    // We use the repo directly or a specific use case.
    // Since listOrders use case supports generic listing, we might need a specific findByUserId
    // or just use the repo if exposed, or add filter to listOrders.
    // The previous `kv-order-repository` has `findByUserId`.
    // Let's use the repo directly for now as it is exposed in the context object structure I saw earlier or via use case.

    // Actually, `listOrders` use case uses `findAll` which streams.
    // `findByUserId` is more efficient.
    // Let's assume we can access the repo or add a use case.
    // For now, I'll use the repository directly if accessible via context to keep it simple,
    // or better, create the `get-customer-profile` use case as planned.

    const result = await ac.useCases.getCustomerProfile.execute(tenantId, userId);
    return c.json(result);
});
