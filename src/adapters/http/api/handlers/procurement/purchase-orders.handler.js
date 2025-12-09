import { toApiPO } from '../../transformers/procurement.transformer.js';

export const listPurchaseOrdersHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');

    // Assuming listPurchaseOrders exists
    const result = await procurement.useCases.listPurchaseOrders.execute(tenantId);
    const list = Array.isArray(result) ? result : (result.items || []);
    return c.json({ items: list.map(toApiPO) });
};

export const createPurchaseOrderHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const data = c.get('validatedData');

    const po = await procurement.useCases.createPurchaseOrder.execute(tenantId, data);
    return c.json(toApiPO(po), 201);
};
