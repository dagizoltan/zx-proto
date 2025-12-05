import { Hono } from 'hono';
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { UsersPage } from '../../pages/admin/users-page.jsx';
import { CreateUserPage } from '../../pages/admin/create-user-page.jsx';
import { UserDetailPage } from '../../pages/admin/user-detail-page.jsx';
import { RolesPage } from '../../pages/admin/roles-page.jsx';
import { CreateRolePage } from '../../pages/admin/create-role-page.jsx';
import { RoleDetailPage } from '../../pages/admin/role-detail-page.jsx';
import { CustomersPage } from '../../pages/admin/customers-page.jsx';
import { CreateCustomerPage } from '../../pages/admin/create-customer-page.jsx';
import { CustomerDetailPage } from '../../pages/admin/customer-detail-page.jsx';

export const accessControlRoutes = new Hono();

// Users
accessControlRoutes.get('/users', async (c) => {
    try {
        const user = c.get('user');
        const tenantId = c.get('tenantId');
        const ac = c.ctx.get('domain.accessControl');

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
});

accessControlRoutes.get('/users/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');
    const roles = await ac.useCases.listRoles.execute(tenantId);

    const html = await renderPage(CreateUserPage, {
        user,
        roles,
        activePage: 'users',
        layout: AdminLayout,
        title: 'New User - IMS Admin'
    });
    return c.html(html);
});

accessControlRoutes.post('/users', async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');
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
        return c.redirect('/admin/users');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

accessControlRoutes.get('/users/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const userId = c.req.param('id');
    const ac = c.ctx.get('domain.accessControl');

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
});

// Roles
accessControlRoutes.get('/roles', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');

    const roles = await ac.useCases.listRoles.execute(tenantId);

    const html = await renderPage(RolesPage, {
        user,
        roles,
        activePage: 'roles',
        layout: AdminLayout,
        title: 'Roles - IMS Admin'
    });
    return c.html(html);
});

accessControlRoutes.get('/roles/new', async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreateRolePage, {
        user,
        activePage: 'roles',
        layout: AdminLayout,
        title: 'New Role - IMS Admin'
    });
    return c.html(html);
});

accessControlRoutes.post('/roles', async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');
    const body = await c.req.parseBody();

    try {
        await ac.useCases.createRole.execute(tenantId, {
            name: body.name,
            permissions: []
        });
        return c.redirect('/admin/roles');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

accessControlRoutes.get('/roles/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const roleId = c.req.param('id');
    const ac = c.ctx.get('domain.accessControl');

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
});

// Customers
accessControlRoutes.get('/customers', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');

    const { items: customers } = await ac.useCases.listUsers.execute(tenantId, { limit: 50 });

    const html = await renderPage(CustomersPage, {
        user,
        customers,
        activePage: 'customers',
        layout: AdminLayout,
        title: 'Customers - IMS Admin'
    });
    return c.html(html);
});

accessControlRoutes.get('/customers/new', async (c) => {
    const user = c.get('user');
    const html = await renderPage(CreateCustomerPage, {
        user,
        activePage: 'customers',
        layout: AdminLayout,
        title: 'New Customer - IMS Admin'
    });
    return c.html(html);
});

accessControlRoutes.post('/customers', async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.accessControl');
    const body = await c.req.parseBody();

    try {
        const newUser = await ac.useCases.registerUser.execute(tenantId, {
            name: body.name,
            email: body.email,
            password: body.password
        });

        const roles = await ac.useCases.listRoles.execute(tenantId);
        const customerRole = roles.find(r => r.name.toLowerCase() === 'customer');

        if (customerRole) {
            await ac.useCases.assignRole.execute(tenantId, {
                userId: newUser.id,
                roleIds: [customerRole.id]
            });
        }

        return c.redirect('/admin/customers');
    } catch (e) {
        return c.text(e.message, 400);
    }
});

accessControlRoutes.get('/customers/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const customerId = c.req.param('id');
    const ac = c.ctx.get('domain.accessControl');

    try {
        const customerData = await ac.useCases.getCustomerProfile.execute(tenantId, customerId);
        const html = await renderPage(CustomerDetailPage, {
            user,
            customer: customerData,
            activePage: 'customers',
            layout: AdminLayout,
            title: 'Customer Details - IMS Admin'
        });
        return c.html(html);
    } catch (e) {
        return c.text(e.message, 404);
    }
});
