import { toApiRole } from '../../transformers/system.transformer.js';

export const listRolesHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    // Note: listRoles use case might not support pagination in current impl
    // based on original route: `await ac.useCases.listRoles.execute(tenantId)`
    const roles = await ac.useCases.listRoles.execute(tenantId);

    // If it returns array directly
    if (Array.isArray(roles)) {
        return c.json({ items: roles.map(toApiRole) });
    }

    return c.json({ items: [] });
};
