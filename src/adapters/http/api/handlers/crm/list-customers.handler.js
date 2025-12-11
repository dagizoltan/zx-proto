import { toApiCustomer } from '../../transformers/crm.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listCustomersHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const accessControl = c.ctx.get('domain.access-control');

    const result = unwrap(await accessControl.useCases.findUsersByRole.execute(tenantId, 'customer')); // Assuming role ID or name logic
    // findUsersByRole returns { items, nextCursor }
    return c.json({ items: result.items.map(toApiCustomer) });
};
