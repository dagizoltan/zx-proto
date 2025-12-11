import { toApiShipment } from '../../transformers/orders.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listShipmentsHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');

    const result = unwrap(await orders.useCases.listShipments.execute(tenantId));
    // listShipments likely returns { items } via repo.list
    return c.json({ items: result.items.map(toApiShipment) });
};
