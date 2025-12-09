import { toApiCustomerList } from '../../transformers/crm.transformer.js';

export const listCustomersHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    const query = c.get('validatedQuery');
    const searchTerm = query.q || query.search;

    // Reusing listUsers from access-control as customers are users
    // Ideally, should be a dedicated use case filtering by role 'customer' if needed.
    // Original route: `ac.useCases.listUsers.execute(...)`
    const result = await ac.useCases.listUsers.execute(tenantId, {
        limit: query.limit,
        cursor: query.cursor,
        search: searchTerm
    });

    return c.json(toApiCustomerList(result));
};
