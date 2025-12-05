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
          <div class="stat-value">${(stats.revenue || 0).toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <h3>Active Products</h3>
          <div class="stat-value">{stats.activeProducts || '-'}</div>
        </div>
        <div class="stat-card">
          <h3>Low Stock Items</h3>
          <div class="stat-value warn">{stats.lowStockCount || '-'}</div>
        </div>
      </div>

      <div class="card">
        <h2>Recent Orders</h2>
        {orders && orders.length > 0 ? (
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
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
                    <td>
                      <span class={`status-badge ${order.status}`}>{order.status}</span>
                    </td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      <a href={`/admin/orders/${order.id}`} class="btn btn-sm btn-secondary">View</a>
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
