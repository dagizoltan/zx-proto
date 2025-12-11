import { toApiOrder } from '../../transformers/orders.transformer.js';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createOrderHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const orders = c.ctx.get('domain.orders');

    const data = c.get('validatedData');
    const { items } = data;

    const order = unwrap(await orders.useCases.createOrder.execute(tenantId, user.id, items));

    return c.json(toApiOrder(order), 201);
};
