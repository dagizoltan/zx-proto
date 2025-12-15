import { unwrap } from '../../../../../../lib/trust/index.js';

export const createUserHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');
    const body = await c.req.parseBody();

    try {
        const res = await ac.useCases.registerUser.execute(tenantId, {
            name: body.name,
            email: body.email,
            password: body.password
        });
        const newUser = unwrap(res);

        if (body.roleId) {
            await ac.useCases.assignRole.execute(tenantId, {
                userId: newUser.id,
                roleIds: [body.roleId]
            });
        }
        return c.redirect('/ims/access-control/users');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
