import { toApiRole } from '../../transformers/system.transformer.js';

export const createRoleHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');
    const data = c.get('validatedData');

    const role = await ac.useCases.createRole.execute(tenantId, data);
    return c.json(toApiRole(role), 201);
};
