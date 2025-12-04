import { h } from 'preact';
import { AdminLayout } from '../../layouts/admin-layout.jsx';

export const OrderDetailPage = ({ user, order }) => {
  return (
    <div class="order-detail-page">
      <div class="page-header">
        <h1>Order #{order.id.slice(0, 8)}</h1>
        <span class={`status-badge ${order.status}`}>{order.status}</span>
      </div>

      <div class="card">
        <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
                <h4 class="text-muted text-sm uppercase">Customer</h4>
                <p class="font-medium">{order.userId}</p>
            </div>
            <div>
                <h4 class="text-muted text-sm uppercase">Date</h4>
                <p class="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div>
                <h4 class="text-muted text-sm uppercase">Total</h4>
                <p class="font-medium text-xl">${order.total.toFixed(2)}</p>
            </div>
        </div>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
            <thead>
                <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                </tr>
            </thead>
            <tbody>
                {order.items.map(item => (
                <tr>
                    <td>{item.name || item.productId}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      <div class="flex gap-4 mt-4">
        {(order.status === 'CREATED' || order.status === 'PAID') && (
          <form method="POST" action={`/admin/orders/${order.id}/status`}>
            <input type="hidden" name="status" value="SHIPPED" />
            <button type="submit" class="btn btn-primary">Mark as Shipped</button>
          </form>
        )}

        {(order.status !== 'SHIPPED' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') && (
          <form method="POST" action={`/admin/orders/${order.id}/status`}>
            <input type="hidden" name="status" value="CANCELLED" />
            <button type="submit" class="btn btn-danger">Cancel Order</button>
          </form>
        )}
      </div>
    </div>
  );
};
