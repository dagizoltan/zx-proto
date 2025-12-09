import { toApiOrderList } from '../../transformers/orders.transformer.js';

export const listOrdersHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');

    // Validated query from middleware
    const query = c.get('validatedQuery');

    // Construct search term
    const searchTerm = query.q || query.search;

    const result = await orders.useCases.listOrders.execute(tenantId, {
        limit: query.limit,
        cursor: query.cursor,
        status: query.status,
        search: searchTerm,
        minTotal: query.minTotal,
        maxTotal: query.maxTotal,
    });

    return c.json(toApiOrderList(result));
};
