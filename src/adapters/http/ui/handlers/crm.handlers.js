import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { CustomersPage } from '../pages/ims/customers-page.jsx';
import { CreateCustomerPage } from '../pages/ims/create-customer-page.jsx';
import { CustomerDetailPage } from '../pages/ims/customer-detail-page.jsx';

// Customers
export const listCustomersHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const ac = c.ctx.get('domain.access-control');

    // Filter by 'Customer' role
    const roles = await ac.useCases.listRoles.execute(tenantId);
    const customerRole = roles.find(r => r.name.toLowerCase() === 'customer');

    let customers = [];
    if (customerRole) {
        const result = await ac.useCases.findUsersByRole.execute(tenantId, customerRole.id, { limit: 50 });
        customers = result.items;
    } else {
         // Fallback if role doesn't exist yet (though it should from seed)
         const result = await ac.useCases.listUsers.execute(tenantId, { limit: 50 });
         customers = result.items;
    }

    const html = await renderPage(CustomersPage, {
        user,
        customers,
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
        const customerData = await queries.useCases.getCustomerProfile.execute(tenantId, customerId);
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
