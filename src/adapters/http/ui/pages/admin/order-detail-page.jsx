import { h } from 'preact';
import { AdminLayout } from '../../layouts/admin-layout.jsx';

export const OrderDetailPage = ({ user, order }) => {
  const statusColors = {
    CREATED: 'blue',
    PAID: 'indigo',
    SHIPPED: 'green',
    DELIVERED: 'teal',
    CANCELLED: 'red',
  };

  const color = statusColors[order.status] || 'gray';

  return (
    <div class="order-detail-page">
      <div class="header">
        <h1>Order #{order.id.slice(0, 8)}</h1>
        <span class={`status-badge ${color}`}>{order.status}</span>
      </div>

      <div class="meta">
        <p><strong>Customer:</strong> {order.userId}</p>
        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
      </div>

      <div class="items">
        <h2>Items</h2>
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

      <div class="actions">
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

      <style>{`
        .order-detail-page { max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .status-badge { padding: 0.5rem 1rem; border-radius: 4px; color: white; font-weight: bold; }
        .status-badge.blue { background: #3b82f6; }
        .status-badge.green { background: #10b981; }
        .status-badge.red { background: #ef4444; }
        .meta { background: #f3f4f6; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; }
        .items table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
        .items th, .items td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
        .actions { display: flex; gap: 1rem; }
        .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-danger { background: #ef4444; color: white; }
      `}</style>
    </div>
  );
};
