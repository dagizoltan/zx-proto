import { unwrap } from '../../../../../../lib/trust/index.js';

export const createSupplierHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const procurement = c.ctx.get('domain.procurement');
    const body = await c.req.parseBody();

    try {
        unwrap(await procurement.useCases.createSupplier.execute(tenantId, body));
        return c.redirect('/ims/procurement/suppliers');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
