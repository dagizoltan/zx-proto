import { toApiUser } from '../../transformers/system.transformer.js';

export const assignRolesHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.req.param('id');
    const ac = c.ctx.get('domain.access-control');

    const { roleIds } = c.get('validatedData');

    const updatedUser = await ac.useCases.assignRole.execute(tenantId, { userId, roleIds });

    return c.json(toApiUser(updatedUser));
};
