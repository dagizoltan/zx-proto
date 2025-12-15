import { unwrap } from '../../../../../../lib/trust/index.js';

export const createRoleHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');
    const body = await c.req.parseBody();

    try {
        unwrap(await ac.useCases.createRole.execute(tenantId, {
            name: body.name,
            permissions: []
        }));
        return c.redirect('/ims/access-control/roles');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
