import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CreatePriceListPage } from '../../pages/ims/catalog/create-price-list-page.jsx';

export const createPriceListPageHandler = async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreatePriceListPage, {
        user,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: 'New Price List - IMS Admin'
    });
    return c.html(html);
};
