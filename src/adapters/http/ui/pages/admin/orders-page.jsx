import { h } from 'preact';
import { PaginationControls } from '../../components/pagination.jsx';

export const OrdersPage = ({ user, orders, nextCursor, currentUrl }) => {
  return (
    <div class="orders-page">
      <div class="page-header">
        <h1>Orders</h1>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr>
              <td>#{order.id.slice(0, 8)}</td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              <td>{order.userId}</td>
              <td>
                <span class={`status-badge ${order.status}`}>{order.status}</span>
              </td>
              <td>${order.total.toFixed(2)}</td>
              <td>
                <a href={`/admin/orders/${order.id}`} class="btn-link">View</a>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colspan="6" style="text-align: center;">No orders found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <PaginationControls nextCursor={nextCursor} currentUrl={currentUrl} />

      <style>{`
        .orders-page { max-width: 1000px; margin: 0 auto; }
        .page-header { margin-bottom: 2rem; }
        .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table th, .data-table td { text-align: left; padding: 1rem; border-bottom: 1px solid #e5e7eb; }
        .data-table th { background: #f9fafb; font-weight: 600; color: #6b7280; }

        .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
        .status-badge.CREATED { background: #dbeafe; color: #1e40af; }
        .status-badge.PAID { background: #e0e7ff; color: #3730a3; }
        .status-badge.SHIPPED { background: #d1fae5; color: #065f46; }
        .status-badge.DELIVERED { background: #ccfbf1; color: #115e59; }
        .status-badge.CANCELLED { background: #fee2e2; color: #991b1b; }

        .btn-link { color: #2563eb; text-decoration: none; font-weight: 500; }
        .btn-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
};
