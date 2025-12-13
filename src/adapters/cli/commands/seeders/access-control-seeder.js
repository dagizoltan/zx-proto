import { Random, Log, faker } from './utils.js';
import { unwrap, isErr } from '../../../../../lib/trust/index.js'; // Fixed 5 levels

export const seedAccessControl = async (ctx, tenantId) => {
    Log.step('Seeding Access Control (Roles & Users)');
    const ac = ctx.get('domain.access-control');

    // 1. Roles
    const roles = ['admin', 'manager', 'warehouse_staff', 'customer'];
    const roleIds = {};

    for (const name of roles) {
        const permissions = name === 'admin' ? [{ resource: '*', action: '*' }] :
                            name === 'manager' ? [{ resource: '*', action: '*' }] :
                            name === 'customer' ? [{ resource: 'products', action: 'read' }, { resource: 'orders', action: '*' }] :
                            [{ resource: 'inventory', action: '*' }];

        const res = await ac.useCases.createRole.execute(tenantId, { name, permissions });
        if (res.ok) {
            roleIds[name] = res.value.id;
        } else {
            const allRes = await ac.useCases.listRoles.execute(tenantId);
            if (allRes.ok) {
                const existing = allRes.value.find(r => r.name === name);
                if (existing) {
                    roleIds[name] = existing.id;
                } else {
                    console.error(`Failed to create role ${name}:`, res.error);
                    throw new Error(res.error.message);
                }
            }
        }
        await new Promise(r => setTimeout(r, 50)); // Throttle
    }

    // 2. Users
    const usersData = [
        { email: 'admin@imsshop.com', name: 'Super Admin', role: 'admin' },
        { email: 'manager@imsshop.com', name: 'Store Manager', role: 'manager' },
        { email: 'staff@imsshop.com', name: 'Warehouse Guy', role: 'warehouse_staff' },
        { email: 'customer@imsshop.com', name: 'Regular Customer', role: 'customer' }
    ];

    const coreUsers = [];

    for (const u of usersData) {
        let userId;
        let userObj;
        const res = await ac.useCases.registerUser.execute(tenantId, {
            email: u.email,
            password: 'password123',
            name: u.name
        });

        if (res.ok) {
            userId = res.value.id;
            userObj = res.value;
        } else if (res.error.code === 'CONFLICT' || res.error.message.includes('exists')) {
            const findRes = await ac.repositories.user.queryByIndex(tenantId, 'email', u.email);
            if (findRes.ok && findRes.value.items.length > 0) {
                userId = findRes.value.items[0].id;
                userObj = findRes.value.items[0];
            }
        } else {
            console.error(`Failed to create user ${u.email}:`, res.error);
            throw new Error(res.error.message);
        }

        if (userId) {
            const assignRes = await ac.useCases.assignRole.execute(tenantId, { userId, roleIds: [roleIds[u.role]] });
            if (!assignRes.ok) {
                 console.error(`Failed to assign role to ${u.email}:`, assignRes.error);
            }
            if (userObj) coreUsers.push(userObj);
        }
        await new Promise(r => setTimeout(r, 50)); // Throttle increased
    }

    // 3. Batch Customers (Realistic)
    const customers = [];
    const customerCount = 50; // Keep 50 for now, but better quality
    for (let i = 0; i < customerCount; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();
        const name = `${firstName} ${lastName}`;

        let userId;
        const res = await ac.useCases.registerUser.execute(tenantId, {
            email,
            password: 'password123',
            name
        });

        if (res.ok) {
            userId = res.value.id;
            customers.push(res.value);
        } else if (res.error.code === 'CONFLICT') {
             const findRes = await ac.repositories.user.queryByIndex(tenantId, 'email', email);
             if (findRes.ok && findRes.value.items.length > 0) {
                 userId = findRes.value.items[0].id;
                 customers.push(findRes.value.items[0]);
             }
        }

        if (userId) {
            await ac.useCases.assignRole.execute(tenantId, { userId, roleIds: [roleIds.customer] });
        }
        await new Promise(r => setTimeout(r, 20));
    }

    Log.success(`Created ${coreUsers.length} core users and ${customers.length} realistic customers`);

    // Return all users for other seeders
    const allUsers = [...coreUsers, ...customers];

    return { roleIds, customers, coreUsers, allUsers };
};
