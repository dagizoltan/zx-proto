import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateUserPage } from '../../pages/ims/create-user-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const createUserPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    const rolesRes = await ac.useCases.listRoles.execute(tenantId);
    const roles = unwrap(rolesRes).items || unwrap(rolesRes);

    const html = await renderPage(CreateUserPage, {
        user,
        roles: roles.items || roles,
        currentPath: '/ims/access-control/users',
        layout: AdminLayout,
        title: 'New User - IMS Admin'
    });
    return c.html(html);
};
