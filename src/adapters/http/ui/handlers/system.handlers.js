import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { UsersPage } from '../pages/ims/users-page.jsx';
import { CreateUserPage } from '../pages/ims/create-user-page.jsx';
import { UserDetailPage } from '../pages/ims/user-detail-page.jsx';
import { RolesPage } from '../pages/ims/roles-page.jsx';
import { CreateRolePage } from '../pages/ims/create-role-page.jsx';
import { RoleDetailPage } from '../pages/ims/role-detail-page.jsx';
import { SettingsPage } from '../pages/ims/settings-page.jsx';

// Users
export const listUsersHandler = async (c) => {
    try {
        const user = c.get('user');
        const tenantId = c.get('tenantId');
        const ac = c.ctx.get('domain.access-control');

        const { items: users } = await ac.useCases.listUsers.execute(tenantId, { limit: 50 });
        const roles = await ac.useCases.listRoles.execute(tenantId);

        const html = await renderPage(UsersPage, {
            user,
            users,
            roles,
            activePage: 'users',
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
    const roles = await ac.useCases.listRoles.execute(tenantId);

    const html = await renderPage(CreateUserPage, {
        user,
        roles,
        activePage: 'users',
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
        const newUser = await ac.useCases.registerUser.execute(tenantId, {
            name: body.name,
            email: body.email,
            password: body.password
        });

        if (body.roleId) {
            await ac.useCases.assignRole.execute(tenantId, {
                userId: newUser.id,
                roleIds: [body.roleId]
            });
        }
        return c.redirect('/ims/system/users');
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const userDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const userId = c.req.param('id');
    const ac = c.ctx.get('domain.access-control');

    const userData = await ac.repositories.user.findById(tenantId, userId);
    if (!userData) return c.text('User not found', 404);

    const roles = await ac.useCases.listRoles.execute(tenantId);

    const html = await renderPage(UserDetailPage, {
        user,
        userData,
        roles,
        activePage: 'users',
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

    const roles = await ac.useCases.listRoles.execute(tenantId);

    const html = await renderPage(RolesPage, {
        user,
        roles,
        activePage: 'roles',
        layout: AdminLayout,
        title: 'Roles - IMS Admin'
    });
    return c.html(html);
};

export const createRolePageHandler = async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreateRolePage, {
        user,
        activePage: 'roles',
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
        await ac.useCases.createRole.execute(tenantId, {
            name: body.name,
            permissions: []
        });
        return c.redirect('/ims/system/roles');
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const roleDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const roleId = c.req.param('id');
    const ac = c.ctx.get('domain.access-control');

    const role = await ac.repositories.role.findById(tenantId, roleId);
    if (!role) return c.text('Role not found', 404);

    const html = await renderPage(RoleDetailPage, {
        user,
        role,
        activePage: 'roles',
        layout: AdminLayout,
        title: `${role.name} - IMS Admin`
    });
    return c.html(html);
};

// Settings
export const settingsHandler = async (c) => {
  const user = c.get('user');
  const configService = c.ctx.get('config');
  // configService might be undefined if not injected or 'config' key is wrong.
  // Assuming 'config' is available in context.

  const config = configService ? configService.getAll() : {};

  // Filter sensitive config
  const safeConfig = {};
  const sensitiveKeys = ['secret', 'key', 'password', 'token', 'credential'];

  for (const [key, value] of Object.entries(config)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          safeConfig[key] = '********';
      } else {
          safeConfig[key] = value;
      }
  }

  const html = await renderPage(SettingsPage, {
      user,
      config: safeConfig,
      activePage: 'settings',
      layout: AdminLayout,
      title: 'Settings - IMS Admin'
  });
  return c.html(html);
};

// Audit and Notifications handlers removed - they now live in observability/communication handlers
