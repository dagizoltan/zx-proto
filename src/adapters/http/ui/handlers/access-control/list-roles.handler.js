import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { RolesPage } from '../../pages/ims/roles-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

export const listRolesHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    const res = await ac.useCases.listRoles.execute(tenantId);
    const roles = unwrap(res).items || unwrap(res);

    const html = await renderPage(RolesPage, {
        user,
        roles: roles.items || roles,
        currentPath: '/ims/access-control/roles',
        layout: AdminLayout,
        title: 'Roles - IMS Admin'
    });
    return c.html(html);
};
