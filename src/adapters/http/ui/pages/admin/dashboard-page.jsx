import { h } from 'preact';
import { AdminLayout } from '../../layouts/admin-layout.jsx';

export const DashboardPage = ({ user, stats, orders }) => {
  return (
    <div class="dashboard-page">
      <h1>Dashboard</h1>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Orders</h3>
          <div class="stat-value">{stats.totalOrders}</div>
        </div>
        <div class="stat-card">
          <h3>Total Revenue</h3>
          <div class="stat-value">${stats.revenue.toFixed(2)}</div>
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

      <div class="recent-orders">
        <h2>Recent Orders</h2>
        {orders && orders.length > 0 ? (
          <table class="orders-table">
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
                    <a href={`/admin/orders/${order.id}`} class="btn-link">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No recent orders to display.</p>
        )}
      </div>

      <style>{`
        .dashboard-page { max-width: 1000px; margin: 0 auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-card h3 { margin: 0 0 0.5rem 0; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #111827; }
        .stat-value.warn { color: #f59e0b; }

        .recent-orders { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .orders-table { width: 100%; border-collapse: collapse; }
        .orders-table th, .orders-table td { text-align: left; padding: 1rem; border-bottom: 1px solid #e5e7eb; }
        .orders-table th { color: #6b7280; font-weight: 600; }

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
