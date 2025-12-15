import { unwrap } from '../../../../../../lib/trust/index.js';

export const createCategoryHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const body = await c.req.parseBody();

    try {
        unwrap(await catalog.useCases.createCategory.execute(tenantId, {
            name: body.name,
            description: body.description,
            parentId: body.parentId || undefined
        }));
        return c.redirect('/ims/catalog/categories');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
