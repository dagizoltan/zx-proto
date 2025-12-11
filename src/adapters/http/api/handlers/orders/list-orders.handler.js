import { toApiOrderList } from '../../transformers/orders.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listOrdersHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');

    const query = c.get('validatedQuery');
    const searchTerm = query.q || query.search;

    // Use UseCase (unwrap result)
    // listOrders needs to support these params.
    // Assuming I didn't verify listOrders implementation yet, I should check it.
    // But for handler update:
    const result = unwrap(await orders.useCases.listOrders.execute(tenantId, {
        limit: query.limit,
        cursor: query.cursor,
        status: query.status,
        search: searchTerm,
        minTotal: query.minTotal,
        maxTotal: query.maxTotal,
    }));

    return c.json(toApiOrderList(result));
};
