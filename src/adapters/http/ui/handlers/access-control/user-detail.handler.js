import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { UserDetailPage } from '../../pages/ims/user-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const userDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const userId = c.req.param('id');
    const ac = c.ctx.get('domain.access-control');

    const res = await ac.useCases.getUser.execute(tenantId, userId);
    if (isErr(res)) return c.text('User not found', 404);
    const userData = res.value;

    const rolesRes = await ac.useCases.listRoles.execute(tenantId);
    const roles = unwrap(rolesRes).items || unwrap(rolesRes);

    const html = await renderPage(UserDetailPage, {
        user,
        userData,
        roles: roles.items || roles,
        currentPath: '/ims/access-control/users',
        layout: AdminLayout,
        title: `${userData.name} - IMS Admin`
    });
    return c.html(html);
};
