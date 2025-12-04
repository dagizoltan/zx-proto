import { h } from 'preact';
import { AdminLayout } from '../../layouts/admin-layout.jsx';

export const DashboardPage = ({ user, stats }) => {
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
        {/* Placeholder for recent orders table */}
        <p>No recent orders to display.</p>
      </div>
    </div>
  );
};
