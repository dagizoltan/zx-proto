import { toApiWorkOrder } from '../../transformers/manufacturing.transformer.js';

export const listWorkOrdersHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');

    const result = await manufacturing.useCases.listWorkOrders.execute(tenantId);
    const list = Array.isArray(result) ? result : (result.items || []);
    return c.json({ items: list.map(toApiWorkOrder) });
};

export const createWorkOrderHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const data = c.get('validatedData');

    const wo = await manufacturing.useCases.createWorkOrder.execute(tenantId, data);
    return c.json(toApiWorkOrder(wo), 201);
};
