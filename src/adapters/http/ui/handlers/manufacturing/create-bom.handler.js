import { unwrap } from '../../../../../../lib/trust/index.js';

export const createBOMHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const manufacturing = c.ctx.get('domain.manufacturing');
    const body = await c.req.parseBody();

    const components = [];
    const indices = new Set(Object.keys(body).filter(k => k.startsWith('components[')).map(k => k.match(/components\[(\d+)\]/)[1]));

    for (const i of indices) {
        components.push({
            productId: body[`components[${i}][productId]`],
            quantity: parseInt(body[`components[${i}][quantity]`])
        });
    }

    try {
        unwrap(await manufacturing.useCases.createBOM.execute(tenantId, {
            name: body.name,
            productId: body.productId,
            laborCost: parseFloat(body.laborCost || 0),
            components
        }));
        return c.redirect('/ims/manufacturing/boms');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
