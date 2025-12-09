import { h } from 'preact';

export const CustomerDetailPage = ({ customer }) => {
  if (!customer) return <div class="admin-content">Customer not found</div>;

  const { user, orders } = customer;

  return (
    <div>
      <div class="page-header">
        <div>
            <h1>{user.name}</h1>
            <p class="text-muted" style="margin-bottom: 0.25rem;">{user.email}</p>
            <span class="entity-id">ID: {user.id}</span>
        </div>
        <div class="text-right">
            <div class="text-muted text-sm">Joined</div>
            <div class="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
            <h3>Total Orders</h3>
            <div class="stat-value">{orders.length}</div>
        </div>
        <div class="stat-card">
            <h3>Total Spent</h3>
            <div class="stat-value">
                ${orders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}
            </div>
        </div>
        <div class="stat-card">
            <h3>Avg. Order Value</h3>
            <div class="stat-value">
                ${orders.length > 0 ? (orders.reduce((acc, o) => acc + o.total, 0) / orders.length).toFixed(2) : '0.00'}
            </div>
        </div>
      </div>

      <h2>Order History</h2>
      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.length === 0 ? (
                        <tr><td colspan="6" class="text-center text-muted">No orders yet</td></tr>
                    ) : orders.map(order => (
                        <tr key={order.id}>
                            <td>
                                <a href={`/ims/orders/${order.id}`} class="text-info font-medium">#{order.id.slice(0, 8)}</a>
                            </td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                                <span class={`status-badge ${order.status}`}>{order.status}</span>
                            </td>
                            <td>{order.items.length}</td>
                            <td>${order.total.toFixed(2)}</td>
                            <td>
                                <a href={`/ims/orders/${order.id}`} class="btn btn-sm btn-secondary">View</a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
