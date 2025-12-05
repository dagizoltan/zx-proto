import { h } from 'preact';
import { PaginationControls } from '../../../components/pagination.jsx';

export const ShipmentsPage = ({ user, shipments, nextCursor, currentUrl }) => {
  return (
    <div class="shipments-page">
      <div class="page-header">
        <h1>Shipments</h1>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Order ID</th>
                <th>Carrier</th>
                <th>Tracking</th>
                <th>Status</th>
                <th>Shipped Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.length > 0 ? (
                shipments.map(s => (
                  <tr>
                    <td class="font-mono text-sm">{s.id.slice(0, 8)}...</td>
                    <td class="font-mono">{s.code}</td>
                    <td><a href={`/admin/orders/${s.orderId}`}>#{s.orderId.substring(0, 8)}...</a></td>
                    <td>{s.carrier || '-'}</td>
                    <td>{s.trackingNumber || '-'}</td>
                    <td><span class="badge badge-success">{s.status}</span></td>
                    <td>{new Date(s.shippedAt).toLocaleDateString()}</td>
                    <td>
                      <a href={`/admin/shipments/${s.id}`} class="btn btn-sm btn-secondary">View</a>
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
