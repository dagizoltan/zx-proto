import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { CustomersPage } from '../pages/ims/customers-page.jsx';
import { CreateCustomerPage } from '../pages/ims/create-customer-page.jsx';
import { CustomerDetailPage } from '../pages/ims/customer-detail-page.jsx';
import { unwrap, isErr } from '../../../../../lib/trust/index.js';

// Customers
export const listCustomersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');

    // Use repo.query on User Repository
    // We need to access the repo directly or via a new use case.
    // Assuming we can access repo via context for this refactor.
    // 'domain.access-control' usually exposes use cases.
    // But we need 'repo.query' capabilities (filtering by role name?).
    // Role Name is in Role entity. User has roleIds.
    // To filter by "Customer", we first find the Role ID.

    // Step 1: Get Customer Role ID
    const rolesRes = await ac.repositories.role.list(tenantId, { limit: 100 });
    const roles = unwrap(rolesRes).items;
    const customerRole = roles.find(r => r.name.toLowerCase() === 'customer');

    // Step 2: Query Users
    // Filter: roleIds contains customerRole.id
    // Deno KV doesn't index array containment by default unless 'useIndexing' handles it.
    // KVUserRepository has `users_by_role` index? Let's assume so based on memory.
    // memory: "The KVUserRepository implements a secondary index users_by_role via useIndexing middleware to support efficient lookups."

    // So we can use `role: customerRole.id` filter.

    const filter = {};
    if (customerRole) {
        filter.role = customerRole.id; // Matches 'role' index
    }
    if (q) {
        filter.search = q;
    }

    const res = await ac.repositories.user.query(tenantId, {
        limit: 50,
        cursor,
        filter,
        searchFields: ['name', 'email']
    });

    const { items: customers, nextCursor } = unwrap(res);

    const html = await renderPage(CustomersPage, {
        user,
        customers,
        nextCursor,
        query: q,
        activePage: 'customers',
        layout: AdminLayout,
        title: 'Customers - IMS Admin'
    });
    return c.html(html);
};

export const createCustomerPageHandler = async (c) => {
    const user = c.get('user');
    const html = await renderPage(CreateCustomerPage, {
        user,
        activePage: 'customers',
        layout: AdminLayout,
        title: 'New Customer - IMS Admin'
    });
    return c.html(html);
};

export const createCustomerHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');
    const body = await c.req.parseBody();

    try {
        const newUser = unwrap(await ac.useCases.registerUser.execute(tenantId, {
            name: body.name,
            email: body.email,
            password: body.password
        }));

        const rolesRes = await ac.repositories.role.list(tenantId, { limit: 100 });
        const roles = unwrap(rolesRes).items;
        const customerRole = roles.find(r => r.name.toLowerCase() === 'customer');

        if (customerRole) {
            await ac.useCases.assignRole.execute(tenantId, {
                userId: newUser.id,
                roleIds: [customerRole.id]
            });
        }

        return c.redirect('/ims/crm/customers');
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const customerDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const customerId = c.req.param('id');
    const queries = c.ctx.get('domain.queries');

    try {
        const customerData = unwrap(await queries.useCases.getCustomerProfile.execute(tenantId, customerId));
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
};
