import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateSupplierPage } from '../../pages/ims/procurement/create-supplier-page.jsx';

export const createSupplierPageHandler = async (c) => {
    const user = c.get('user');
    const html = await renderPage(CreateSupplierPage, {
        user,
        activePage: 'suppliers',
        layout: AdminLayout,
        title: 'New Supplier - IMS Admin'
    });
    return c.html(html);
};
