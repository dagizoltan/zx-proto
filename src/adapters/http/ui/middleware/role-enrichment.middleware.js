/**
 * Middleware to enrich user object with role names
 *
 * Uses KVRoleRepository to fetch role names from roleIds.
 * Optimized to cache or use batch lookup.
 */
export const roleEnrichmentMiddleware = async (c, next) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');

    // If user is not present or has no roleIds, skip (or assume no roles)
    if (!user || !user.roleIds || user.roleIds.length === 0) {
        if (user) {
            user.roleNames = [];
        }
        await next();
        return;
    }

    // Check if roleNames already exist (e.g. from session/token)
    if (user.roleNames) {
        await next();
        return;
    }

    try {
        const ac = c.ctx.get('domain.access-control');
        const roles = await ac.repositories.role.findByIds(tenantId, user.roleIds);

        // Map to names
        user.roleNames = roles
            .filter(r => r && r.name)
            .map(r => r.name);

        // Update user in context
        c.set('user', user);
    } catch (error) {
        console.error('Failed to enrich user roles:', error);
        user.roleNames = [];
    }

    await next();
};
