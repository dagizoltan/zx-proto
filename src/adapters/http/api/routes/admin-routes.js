import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth-middleware.js';

export const adminRoutes = new Hono();

// Apply Auth Middleware to all admin routes
adminRoutes.use('*', authMiddleware);

// Middleware to check Admin/Manager role
adminRoutes.use('*', async (c, next) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    // If user has no roles, deny
    if (!user.roleIds || user.roleIds.length === 0) {
        return c.json({ error: 'Forbidden: No roles assigned' }, 403);
    }

    // Fetch full role objects to check names/permissions
    let hasAccess = false;
    for (const roleId of user.roleIds) {
        const role = await ac.repositories.role.findById(tenantId, roleId);
        if (role) {
            // Simplified check: Allow 'admin' or 'manager'
            if (role.name === 'admin' || role.name === 'manager') {
                hasAccess = true;
                break;
            }
        }
    }

    if (!hasAccess) {
        return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }

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

    // Extra check: Only admins can assign roles? For now manager can too.

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
adminRoutes.get('/customers', async (c) => {
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

adminRoutes.get('/customers/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.req.param('id');
    const ac = c.ctx.get('domain.access-control');

    try {
        const result = await ac.useCases.getCustomerProfile.execute(tenantId, userId);
        return c.json(result);
    } catch (error) {
        if (error.message === 'Customer not found') {
            return c.json({ error: error.message }, 404);
        }
        throw error;
    }
});
