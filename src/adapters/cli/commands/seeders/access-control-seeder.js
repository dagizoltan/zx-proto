import { Random, Log } from './utils.js';

export const seedAccessControl = async (ctx, tenantId) => {
    Log.step('Seeding Access Control (Roles & Users)');
    const ac = ctx.get('domain.accessControl');

    // 1. Roles
    const roles = ['admin', 'manager', 'warehouse_staff', 'customer'];
    const roleIds = {};

    for (const name of roles) {
        try {
            const permissions = name === 'admin' ? [{ resource: '*', action: '*' }] :
                                name === 'manager' ? [{ resource: '*', action: '*' }] : // Simplified
                                name === 'customer' ? [{ resource: 'products', action: 'read' }, { resource: 'orders', action: '*' }] :
                                [{ resource: 'inventory', action: '*' }];

            const role = await ac.useCases.createRole.execute(tenantId, { name, permissions });
            roleIds[name] = role.id;
        } catch (e) {
            // Fetch if exists
            const all = await ac.useCases.listRoles.execute(tenantId);
            roleIds[name] = all.find(r => r.name === name)?.id;
        }
    }

    // 2. Users
    const users = [
        { email: 'admin@imsshop.com', name: 'Super Admin', role: 'admin' },
        { email: 'manager@imsshop.com', name: 'Store Manager', role: 'manager' },
        { email: 'staff@imsshop.com', name: 'Warehouse Guy', role: 'warehouse_staff' },
        { email: 'customer@imsshop.com', name: 'Regular Customer', role: 'customer' }
    ];

    for (const u of users) {
        try {
            let user = await ac.useCases.registerUser.execute(tenantId, {
                email: u.email,
                password: 'password123',
                name: u.name
            });
            await ac.useCases.assignRole.execute(tenantId, { userId: user.id, roleIds: [roleIds[u.role]] });
        } catch (e) {
            // Ignore if exists
        }
    }

    // 3. Batch Customers (50)
    const customers = [];
    for (let i = 0; i < 50; i++) {
        const email = `cust${i}@test.com`;
        try {
            const user = await ac.useCases.registerUser.execute(tenantId, {
                email,
                password: 'password123',
                name: `Customer ${i}`
            });
            await ac.useCases.assignRole.execute(tenantId, { userId: user.id, roleIds: [roleIds.customer] });
            customers.push(user);
        } catch (e) {
             const existing = await ac.repositories.user.findByEmail(tenantId, email);
             if (existing) customers.push(existing);
        }
    }

    Log.success(`Created ${users.length} core users and ${customers.length} random customers`);
    return { roleIds, customers };
};
