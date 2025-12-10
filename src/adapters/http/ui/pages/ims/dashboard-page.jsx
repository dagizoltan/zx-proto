import { h } from 'preact';
import { AdminLayout } from '../../layouts/admin-layout.jsx';

export const DashboardPage = ({ user, stats }) => {
  const { orders, shipments, manufacturing, procurement, crm, inventory, system } = stats;

  return (
    <div class="dashboard-page">
      <div class="page-header">
        <h1>Dashboard</h1>
        <div class="page-actions">
            {/* Future: Date Range Picker */}
        </div>
      </div>

      {/* TIER 1: HIGH-LEVEL KPIs */}
      <h2 class="section-title">Key Performance Indicators</h2>
      <div class="stat-grid">
        <div class="stat-card">
          <h3>Total Revenue</h3>
          <div class="stat-value">${orders.revenue ? orders.revenue.toFixed(2) : '0.00'}</div>
          <div class="stat-meta">Lifetime Sales</div>
        </div>
        <div class="stat-card">
          <h3>Inventory Value</h3>
          <div class="stat-value">${inventory.totalValue ? inventory.totalValue.toFixed(2) : '0.00'}</div>
           <div class="stat-meta">Asset Value</div>
        </div>
        <div class="stat-card">
          <h3>Active Customers</h3>
          <div class="stat-value">{crm.totalCustomers}</div>
           <div class="stat-meta">Total Users</div>
        </div>
         <div class="stat-card">
          <h3>System Status</h3>
          <div class={`stat-value ${system.status === 'HEALTHY' ? 'success' : 'error'}`}>
              {system.status}
          </div>
          <div class="stat-meta">{system.errors24h} Errors (24h)</div>
        </div>
      </div>

      {/* TIER 2: OPERATIONAL ACTION ITEMS */}
      <h2 class="section-title">Operations & Actions</h2>
      <div class="stat-grid">
        <div class="stat-card">
          <h3>Pending Orders</h3>
          <div class="stat-value">{orders.pending}</div>
        </div>
        <div class="stat-card">
          <h3>Pending Shipments</h3>
          <div class="stat-value">{shipments.pending}</div>
        </div>
        <div class="stat-card">
          <h3>Active Work Orders</h3>
          <div class="stat-value">{manufacturing.activeWorkOrders}</div>
        </div>
        <div class="stat-card">
          <h3>Open POs</h3>
          <div class="stat-value">{procurement.openPOs}</div>
        </div>
        <div class="stat-card">
          <h3>Low Stock Items</h3>
          <div class="stat-value warn">{inventory.lowStockCount}</div>
        </div>
      </div>

      {/* TIER 3: RECENT ACTIVITY */}
       <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-4);">
          {/* RECENT ORDERS */}
          <div class="card">
            <div class="card-header">
                <h2>Recent Orders</h2>
                <a href="/ims/orders" class="btn btn-sm btn-link">View All</a>
            </div>
            {orders.recent && orders.recent.length > 0 ? (
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.recent.map(order => (
                      <tr>
                        <td><a href={`/ims/orders/${order.id}`}>#{order.id.slice(0, 8)}</a></td>
                        <td><span class={`status-badge ${order.status}`}>{order.status}</span></td>
                        <td>${order.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p class="text-muted">No recent orders.</p>
            )}
          </div>

          {/* RECENT WORK ORDERS */}
          <div class="card">
            <div class="card-header">
                <h2>Recent Work Orders</h2>
                <a href="/ims/manufacturing/work-orders" class="btn btn-sm btn-link">View All</a>
            </div>
            {manufacturing.recent && manufacturing.recent.length > 0 ? (
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manufacturing.recent.map(wo => (
                      <tr>
                        <td><a href={`/ims/manufacturing/work-orders/${wo.id}`}>#{wo.id.slice(0, 8)}</a></td>
                         <td><span class={`status-badge ${wo.status}`}>{wo.status}</span></td>
                        <td>{new Date(wo.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p class="text-muted">No recent work orders.</p>
            )}
          </div>
      </div>

       {/* RECENT SYSTEM ACTIVITY */}
      <div class="card" style="margin-top: var(--space-4);">
         <div class="card-header">
                <h2>System Activity</h2>
                <a href="/ims/system/audit-logs" class="btn btn-sm btn-link">View Logs</a>
            </div>
          {system.recentActivity && system.recentActivity.length > 0 ? (
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Resource</th>
                    </tr>
                  </thead>
                  <tbody>
                    {system.recentActivity.map(log => (
                      <tr>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>{log.userId}</td>
                        <td>{log.action}</td>
                        <td>{log.resource}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p class="text-muted">No recent system activity.</p>
            )}
      </div>
    </div>
  );
};
