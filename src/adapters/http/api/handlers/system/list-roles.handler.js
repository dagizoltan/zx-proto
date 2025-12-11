import { toApiRole } from '../../transformers/system.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listRolesHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    const result = unwrap(await ac.useCases.listRoles.execute(tenantId));

    // listRoles returns items array directly or inside object?
    // In Step 2, I implemented listRoles.js to return Ok(items).
    // So result IS items (array).

    if (Array.isArray(result)) {
        return c.json({ items: result.map(toApiRole) });
    }
    // If it returns { items }
    if (result.items) {
        return c.json({ items: result.items.map(toApiRole) });
    }

    return c.json({ items: [] });
};
