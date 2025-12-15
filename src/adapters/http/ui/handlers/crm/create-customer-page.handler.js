import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateCustomerPage } from '../../pages/ims/create-customer-page.jsx';

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
