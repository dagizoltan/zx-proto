import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreateWarehousePage } from '../../pages/ims/inventory/create-warehouse-page.jsx';

export const createWarehousePageHandler = async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreateWarehousePage, {
        user,
        activePage: 'warehouses',
        layout: AdminLayout,
        title: 'New Warehouse - IMS Admin'
    });
    return c.html(html);
};
