import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { UsersPage } from '../pages/ims/users-page.jsx';
import { CreateUserPage } from '../pages/ims/create-user-page.jsx';
import { UserDetailPage } from '../pages/ims/user-detail-page.jsx';
import { RolesPage } from '../pages/ims/roles-page.jsx';
import { CreateRolePage } from '../pages/ims/create-role-page.jsx';
import { RoleDetailPage } from '../pages/ims/role-detail-page.jsx';
import { unwrap, isErr } from '../../../../../lib/trust/index.js';

// Users
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
        return c.redirect('/ims/access-control/users'); // Updated redirect
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const userDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const userId = c.req.param('id');
    const ac = c.ctx.get('domain.access-control');

    const res = await ac.repositories.user.findById(tenantId, userId);
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

// Roles
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

export const createRoleHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');
    const body = await c.req.parseBody();

    try {
        unwrap(await ac.useCases.createRole.execute(tenantId, {
            name: body.name,
            permissions: []
        }));
        return c.redirect('/ims/access-control/roles'); // Updated redirect
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const roleDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const roleId = c.req.param('id');
    const ac = c.ctx.get('domain.access-control');

    const res = await ac.repositories.role.findById(tenantId, roleId);
    if (isErr(res)) return c.text('Role not found', 404);
    const role = res.value;

    const html = await renderPage(RoleDetailPage, {
        user,
        role,
        currentPath: '/ims/access-control/roles',
        layout: AdminLayout,
        title: `${role.name} - IMS Admin`
    });
    return c.html(html);
};

// Handlers for assignRole is currently in an API route or needs to be here?
// In system.handlers.js it wasn't there. It was likely in api/system/...
// But I saw `systemRoutes.post('/users', handlers.createUserHandler);`
// The `assignRoleHandler` I put in the route file earlier needs an implementation if I keep it there.
// But `UsersPage` calls `/api/ims/users/${userId}/roles`.
// I should remove `assignRoleHandler` from `access-control-routes.js` if it's not being used by the UI directly as a page or form post that expects HTML.
// The `UsersPage` uses fetch JSON.
// So I will remove `assignRoleHandler` from `access-control-routes.js` in a later step or just not implement it here if it's already in API.
// I'll stick to what was in `system.handlers.js`.
