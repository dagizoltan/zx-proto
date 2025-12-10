import { h } from 'preact';
import { PaginationControls } from '../../../components/pagination.jsx';

export const ShipmentsPage = ({ user, shipments, nextCursor, currentUrl }) => {
  return (
    <div class="shipments-page">
      <div class="page-header">
        <h1>Shipments</h1>
        <a href="/ims/shipments/new" class="btn btn-primary">Create Shipment</a>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
            <h3>Pending</h3>
            <div class="stat-value">{shipments.filter(s => s.status !== 'DELIVERED').length}</div>
        </div>
        <div class="stat-card">
            <h3>Recent</h3>
            <div class="stat-value">{shipments.length}</div>
        </div>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Order ID</th>
                <th>Carrier</th>
                <th>Tracking</th>
                <th>Status</th>
                <th class="text-right">Shipped Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.length > 0 ? (
                shipments.map(s => (
                  <tr>
                    <td class="font-mono text-sm">
                        <a href={`/ims/shipments/${s.id}`}>{s.id.slice(0, 8)}...</a>
                    </td>
                    <td class="font-mono">{s.code}</td>
                    <td><a href={`/ims/orders/${s.orderId}`}>#{s.orderId.substring(0, 8)}...</a></td>
                    <td>{s.carrier || '-'}</td>
                    <td>{s.trackingNumber || '-'}</td>
                    <td><span class={`status-badge ${s.status}`}>{s.status}</span></td>
                    <td class="text-right">{new Date(s.shippedAt).toLocaleDateString()}</td>
                    <td class="text-right">
                      <a href={`/ims/shipments/${s.id}`} class="btn btn-sm btn-secondary">View</a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colspan="8" class="text-center py-4 text-muted">No shipments found.</td>
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
