export const roleCheckMiddleware = (allowedRoles) => {
    return async (c, next) => {
        const user = c.get('user');
        const tenantId = c.get('tenantId');
        const ac = c.ctx.get('domain.access-control');

        // If user has no roles, deny
        if (!user.roleIds || user.roleIds.length === 0) {
            return c.json({ error: 'Forbidden: No roles assigned' }, 403);
        }

        // Fetch full role objects to check names/permissions
        let hasAccess = false;

        // Optimize: If we just need to check names, we might want to cache or optimize this lookup
        // but for now, we follow existing logic.
        const roles = await ac.repositories.role.findByIds(tenantId, user.roleIds);

        for (const role of roles) {
            if (role && allowedRoles.includes(role.name)) {
                hasAccess = true;
                break;
            }
        }

        if (!hasAccess) {
            return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
        }

        await next();
    };
};
