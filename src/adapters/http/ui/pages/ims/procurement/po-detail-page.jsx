import { h } from 'preact';

export const PurchaseOrderDetailPage = ({ user, po }) => {
  return (
    <div class="po-detail-page">
      <div class="page-header">
        <div>
            <h1>{po.code}</h1>
            <span class="entity-id">ID: {po.id}</span>
        </div>
        <div class="actions">
            <a href="/ims/procurement/purchase-orders" class="btn btn-secondary">Back to List</a>
            {['DRAFT', 'ISSUED', 'PARTIAL'].includes(po.status) && (
                <a href={`/ims/procurement/purchase-orders/${po.id}/receive`} class="btn btn-primary">Receive Items</a>
            )}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6 mb-6">
          <div class="card">
              <h3>Order Details</h3>
              <div class="mb-2">
                  <label class="text-muted">Status</label>
                  <div><span class={`badge badge-${po.status.toLowerCase()}`}>{po.status}</span></div>
              </div>
              <div class="mb-2">
                  <label class="text-muted">Created Date</label>
                  <div>{new Date(po.createdAt).toLocaleDateString()}</div>
              </div>
              <div class="mb-2">
                  <label class="text-muted">Expected Date</label>
                  <div>{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'N/A'}</div>
              </div>
          </div>
          <div class="card">
              <h3>Supplier</h3>
              <div class="mb-2">
                  <label class="text-muted">Name</label>
                  <div>{po.supplierName}</div>
              </div>
              <div class="mb-2">
                  <label class="text-muted">Total Cost</label>
                  <div class="text-xl font-bold">${po.totalCost.toFixed(2)}</div>
              </div>
          </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
            <h3>Items Ordered</h3>
            <div class="stat-value">{po.items.reduce((acc, i) => acc + i.quantity, 0)}</div>
        </div>
        <div class="stat-card">
            <h3>Items Received</h3>
            <div class={`stat-value ${po.items.some(i => i.receivedQuantity < i.quantity) ? 'text-warning' : 'text-success'}`}>
                {po.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0)}
            </div>
        </div>
        <div class="stat-card">
            <h3>Completion</h3>
            <div class="stat-value">
                {Math.round((po.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0) / po.items.reduce((acc, i) => acc + i.quantity, 0)) * 100)}%
            </div>
        </div>
      </div>

      <h3>Line Items</h3>
      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Ordered</th>
                        <th>Received</th>
                        <th>Unit Cost</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {po.items.map(item => (
                        <tr>
                            <td>
                                <div>{item.productName || 'Unknown Product'}</div>
                                <small class="text-muted">{item.sku}</small>
                            </td>
                            <td>{item.quantity}</td>
                            <td>
                                <span class={item.receivedQuantity < item.quantity ? 'text-warning' : 'text-success'}>
                                    {item.receivedQuantity}
                                </span>
                            </td>
                            <td>${item.unitCost.toFixed(2)}</td>
                            <td>${(item.quantity * item.unitCost).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
