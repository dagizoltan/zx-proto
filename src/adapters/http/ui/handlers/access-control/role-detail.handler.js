import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { RoleDetailPage } from '../../pages/ims/role-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const roleDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const roleId = c.req.param('id');
    const ac = c.ctx.get('domain.access-control');

    const res = await ac.useCases.getRole.execute(tenantId, roleId);
    if (isErr(res)) return c.text('Role not found', 404);
    const role = res.value;

    const usersRes = await ac.useCases.findUsersByRole.execute(tenantId, roleId);
    const users = unwrap(usersRes).items || [];

    const html = await renderPage(RoleDetailPage, {
        user,
        role,
        users,
        currentPath: '/ims/access-control/roles',
        layout: AdminLayout,
        title: `${role.name} - IMS Admin`
    });
    return c.html(html);
};
