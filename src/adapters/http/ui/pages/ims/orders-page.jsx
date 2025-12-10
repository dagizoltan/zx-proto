import { h } from 'preact';
import { PaginationControls } from '../../components/pagination.jsx';

export const OrdersPage = ({ user, orders, nextCursor, currentUrl }) => {
  return (
    <div class="orders-page">
      <div class="page-header">
        <h1>Orders</h1>
        <a href="/ims/orders/new" class="btn btn-primary">New Order</a>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
            <h3>Orders (Page)</h3>
            <div class="stat-value">{orders.length}</div>
        </div>
        <div class="stat-card">
            <h3>Revenue (Page)</h3>
            <div class="stat-value">${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</div>
        </div>
        <div class="stat-card">
            <h3>Pending</h3>
            <div class="stat-value">{orders.filter(o => ['CREATED', 'PAID', 'PARTIALLY_SHIPPED'].includes(o.status)).length}</div>
        </div>
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
                    <th class="text-right">Total</th>
                    <th class="text-right">Actions</th>
                </tr>
                </thead>
                <tbody>
                {orders.map(order => (
                    <tr>
                    <td class="font-mono text-sm">
                        <a href={`/ims/orders/${order.id}`}>{order.id.slice(0, 8)}...</a>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.userId}</td>
                    <td>
                        <span class={`status-badge ${order.status}`}>{order.status}</span>
                    </td>
                    <td class="text-right">${order.total.toFixed(2)}</td>
                    <td class="text-right">
                        <a href={`/ims/orders/${order.id}`} class="btn btn-sm btn-secondary">View</a>
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
