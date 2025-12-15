import { unwrap } from '../../../../../../lib/trust/index.js';

export const createCustomerHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');
    const body = await c.req.parseBody();

    try {
        const newUser = unwrap(await ac.useCases.registerUser.execute(tenantId, {
            name: body.name,
            email: body.email,
            password: body.password
        }));

        const rolesRes = await ac.useCases.listRoles.execute(tenantId);
        const roles = unwrap(rolesRes).items || unwrap(rolesRes);
        const customerRole = roles.find(r => r.name.toLowerCase() === 'customer');

        if (customerRole) {
            await ac.useCases.assignRole.execute(tenantId, {
                userId: newUser.id,
                roleIds: [customerRole.id]
            });
        }

        return c.redirect('/ims/crm/customers');
    } catch (e) {
        return c.text(e.message, 400);
    }
};
