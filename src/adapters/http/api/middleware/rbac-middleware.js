import { LRUCache } from "https://esm.sh/lru-cache@10.2.0";
import { isErr } from '../../../../../lib/trust/index.js';

// Cache for role definitions: Key = "tenantId:roleId", Value = Role Object
// TTL: 5 minutes, Max: 500 items
const roleCache = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 5,
});

export const roleCheckMiddleware = (allowedRoles) => {
    return async (c, next) => {
        const user = c.get('user');
        const tenantId = c.get('tenantId');
        const ac = c.ctx.get('domain.access-control');

        // If user has no roles, deny
        if (!user.roleIds || user.roleIds.length === 0) {
            return c.json({ error: 'Forbidden: No roles assigned' }, 403);
        }

        // Resolve roles (Cache-First Strategy)
        const resolvedRoles = [];
        const missingRoleIds = [];

        for (const roleId of user.roleIds) {
            const cacheKey = `${tenantId}:${roleId}`;
            const cached = roleCache.get(cacheKey);
            if (cached) {
                resolvedRoles.push(cached);
            } else {
                missingRoleIds.push(roleId);
            }
        }

        if (missingRoleIds.length > 0) {
            // Updated to handle Result type from Repository Adapter
            const result = await ac.repositories.role.findByIds(tenantId, missingRoleIds);

            if (isErr(result)) {
                console.error('Failed to fetch roles for RBAC check', result.error);
                return c.json({ error: 'Internal Server Error' }, 500);
            }

            const fetched = result.value; // List of roles

            for (const role of fetched) {
                if (role) {
                    resolvedRoles.push(role);
                    roleCache.set(`${tenantId}:${role.id}`, role);
                }
            }
        }

        let hasAccess = false;
        for (const role of resolvedRoles) {
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
