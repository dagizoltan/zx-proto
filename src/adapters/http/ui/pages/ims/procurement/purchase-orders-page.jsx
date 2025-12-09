import { h } from 'preact';

export const PurchaseOrdersPage = ({ user, purchaseOrders }) => {
  return (
    <div class="purchase-orders-page">
      <div class="page-header">
        <h1>Purchase Orders</h1>
        <a href="/ims/procurement/purchase-orders/new" class="btn btn-primary">Create PO</a>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
            <h3>Open POs</h3>
            <div class="stat-value">{purchaseOrders.filter(po => ['DRAFT', 'ISSUED', 'PARTIAL'].includes(po.status)).length}</div>
        </div>
        <div class="stat-card">
            <h3>Waiting Receipt</h3>
            <div class="stat-value">{purchaseOrders.filter(po => ['ISSUED', 'PARTIAL'].includes(po.status)).length}</div>
        </div>
        <div class="stat-card">
            <h3>Total Value (Page)</h3>
            <div class="stat-value">${purchaseOrders.reduce((sum, po) => sum + po.totalCost, 0).toFixed(2)}</div>
        </div>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Status</th>
                <th>Supplier</th>
                <th>Total Cost</th>
                <th>Expected Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map(po => (
                <tr>
                  <td class="font-mono text-sm">{po.id.slice(0, 8)}...</td>
                  <td><a href={`/ims/procurement/purchase-orders/${po.id}`}>{po.code}</a></td>
                  <td><span class={`badge badge-${po.status.toLowerCase()}`}>{po.status}</span></td>
                  <td>{po.supplierName || 'Unknown'}</td>
                  <td>${po.totalCost.toFixed(2)}</td>
                  <td>{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <a href={`/ims/purchase-orders/${po.id}`} class="btn btn-sm btn-secondary" style="margin-right: 0.25rem;">View</a>
                    {['DRAFT', 'ISSUED', 'PARTIAL'].includes(po.status) && (
                        <a href={`/ims/purchase-orders/${po.id}/receive`} class="btn btn-sm btn-primary">Receive</a>
                    )}
                  </td>
                </tr>
              ))}
              {purchaseOrders.length === 0 && (
                <tr><td colspan="7" class="text-center">No purchase orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
