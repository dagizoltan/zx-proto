import { h } from 'preact';
import { PaginationControls } from '../../components/pagination.jsx';

export const OrdersPage = ({ user, orders, nextCursor, currentUrl }) => {
  return (
    <div class="orders-page">
      <div class="page-header">
        <h1>Orders</h1>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                <tr>
                    <th>ID</th>
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
                    <td class="font-mono text-sm">{order.id.slice(0, 8)}...</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.userId}</td>
                    <td>
                        <span class={`status-badge ${order.status}`}>{order.status}</span>
                    </td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                        <a href={`/admin/orders/${order.id}`} class="btn btn-sm btn-secondary">View</a>
                    </td>
                    </tr>
                ))}
                {orders.length === 0 && (
                    <tr>
                    <td colspan="6" class="text-center text-muted">No orders found.</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
      </div>

      <PaginationControls nextCursor={nextCursor} currentUrl={currentUrl} />
    </div>
  );
};
