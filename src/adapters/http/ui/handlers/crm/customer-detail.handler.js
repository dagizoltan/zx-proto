import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CustomerDetailPage } from '../../pages/ims/customer-detail-page.jsx';
import { unwrap } from '../../../../../../lib/trust/index.js';

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
