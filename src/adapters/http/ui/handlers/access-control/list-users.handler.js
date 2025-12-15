import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { UsersPage } from '../../pages/ims/users-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listUsersHandler = async (c) => {
    try {
        const user = c.get('user');
        const tenantId = c.get('tenantId');
        const ac = c.ctx.get('domain.access-control');

        const usersRes = await ac.useCases.listUsers.execute(tenantId, { limit: 50 });
        const { items: users } = unwrap(usersRes);

        const rolesRes = await ac.useCases.listRoles.execute(tenantId);
        const roles = unwrap(rolesRes).items || unwrap(rolesRes);

        const html = await renderPage(UsersPage, {
            user,
            users,
            roles: roles.items || roles,
            currentPath: '/ims/access-control/users',
            layout: AdminLayout,
            title: 'Users & Roles - IMS Admin'
        });
        return c.html(html);
    } catch (e) {
        return c.text(e.message + '\n' + e.stack, 500);
    }
};
