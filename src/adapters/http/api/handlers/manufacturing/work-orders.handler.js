import { toApiWorkOrder } from '../../transformers/manufacturing.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listWorkOrdersHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');

    const result = unwrap(await manufacturing.useCases.listWorkOrders.execute(tenantId));
    return c.json({ items: result.items.map(toApiWorkOrder) });
};

export const createWorkOrderHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const data = c.get('validatedData');

    const wo = unwrap(await manufacturing.useCases.createWorkOrder.execute(tenantId, data));
    return c.json(toApiWorkOrder(wo), 201);
};
