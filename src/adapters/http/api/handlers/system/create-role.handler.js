import { toApiRole } from '../../transformers/system.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createRoleHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');
    const data = c.get('validatedData');

    const role = unwrap(await ac.useCases.createRole.execute(tenantId, data));
    return c.json(toApiRole(role), 201);
};
