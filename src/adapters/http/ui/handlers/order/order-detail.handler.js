import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { OrderDetailPage } from '../../pages/ims/order-detail-page.jsx';
import { unwrap, isErr } from '../../../../../../lib/trust/index.js';

export const orderDetailHandler = async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const orderId = c.req.param('id');
  const orders = c.ctx.get('domain.orders');
  const catalog = c.ctx.get('domain.catalog');

  const res = await orders.useCases.getOrder.execute(tenantId, orderId);
  if (isErr(res)) return c.text('Order not found', 404);
  const order = res.value;

  const productIdsToFetch = new Set();
  for (const item of order.items) {
      if (!item.productName) productIdsToFetch.add(item.productId);
  }

  if (productIdsToFetch.size > 0) {
      const productsRes = await catalog.useCases.getProductsBatch.execute(tenantId, Array.from(productIdsToFetch));
      if (!isErr(productsRes)) {
          const productMap = new Map(productsRes.value.map(p => [p.id, p]));
          for (const item of order.items) {
              if (!item.productName && productMap.has(item.productId)) {
                  item.productName = productMap.get(item.productId).name;
              }
          }
      }
  }
  for (const item of order.items) {
      if (!item.productName) item.productName = 'Unknown Product';
  }

  const shipRes = await orders.useCases.listShipments.execute(tenantId, { orderId });
  const { items: shipments } = unwrap(shipRes);

  const html = await renderPage(OrderDetailPage, {
    user,
    order,
    shipments,
    layout: AdminLayout,
    title: `Order #${order.id} - IMS Admin`
  });

  return c.html(html);
};
