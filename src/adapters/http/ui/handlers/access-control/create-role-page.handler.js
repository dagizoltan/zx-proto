import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateRolePage } from '../../pages/ims/create-role-page.jsx';

export const createRolePageHandler = async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreateRolePage, {
        user,
        currentPath: '/ims/access-control/roles',
        layout: AdminLayout,
        title: 'New Role - IMS Admin'
    });
    return c.html(html);
};
