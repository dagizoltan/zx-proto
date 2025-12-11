import { toApiPO } from '../../transformers/procurement.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listPurchaseOrdersHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');

    const result = unwrap(await procurement.useCases.listPurchaseOrders.execute(tenantId));
    // result is { items, nextCursor } from list use case
    return c.json({ items: result.items.map(toApiPO) });
};

export const createPurchaseOrderHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const data = c.get('validatedData');

    const po = unwrap(await procurement.useCases.createPurchaseOrder.execute(tenantId, data));
    return c.json(toApiPO(po), 201);
};
