import { h } from 'preact';
import { AdminLayout } from '../../layouts/admin-layout.jsx';

export const DashboardPage = ({ user, stats, orders }) => {
  return (
    <div class="dashboard-page">
      <div class="page-header">
        <h1>Dashboard</h1>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <h3>Total Orders</h3>
          <div class="stat-value">{stats.totalOrders}</div>
        </div>
        <div class="stat-card">
          <h3>Total Revenue</h3>
          <div class="stat-value">${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}</div>
        </div>
        <div class="stat-card">
          <h3>Pending Orders</h3>
          <div class="stat-value">{stats.pendingOrders || 0}</div>
        </div>
        <div class="stat-card">
          <h3>Low Stock Items</h3>
          <div class="stat-value warn">{stats.lowStockCount || 0}</div>
        </div>
      </div>

      <div class="card">
        <h2>Recent Orders</h2>
        {orders && orders.length > 0 ? (
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
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
                    <td>
                      <span class={`status-badge ${order.status}`}>{order.status}</span>
                    </td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      <a href={`/ims/orders/${order.id}`} class="btn btn-sm btn-secondary">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p class="text-muted">No recent orders to display.</p>
        )}
      </div>
    </div>
  );
};
