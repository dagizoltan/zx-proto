import { unwrap } from '../../../../../../lib/trust/index.js';

export const createPriceListHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const body = await c.req.parseBody();

    try {
        unwrap(await catalog.useCases.createPriceList.execute(tenantId, {
            name: body.name,
            currency: body.currency,
            description: body.description,
            prices: {}
        }));
        return c.redirect('/ims/catalog/price-lists');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
