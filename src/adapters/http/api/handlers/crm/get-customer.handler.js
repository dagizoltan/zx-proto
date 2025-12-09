import { toApiCustomerProfile } from '../../transformers/crm.transformer.js';

export const getCustomerHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.req.param('id');
    const queries = c.ctx.get('domain.queries');

    try {
        const result = await queries.useCases.getCustomerProfile.execute(tenantId, userId);
        return c.json(toApiCustomerProfile(result));
    } catch (error) {
        if (error.message === 'Customer not found') {
            return c.json({ error: error.message }, 404);
        }
        throw error;
    }
};
