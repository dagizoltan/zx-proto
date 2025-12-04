import { h } from 'preact';

export const PurchaseOrderDetailPage = ({ user, po }) => {
  return (
    <div class="po-detail-page">
      <div class="page-header">
        <h1>{po.code}</h1>
        <div class="actions">
            <a href="/admin/purchase-orders" class="btn btn-secondary">Back to List</a>
            {['DRAFT', 'ISSUED', 'PARTIAL'].includes(po.status) && (
                <a href={`/admin/purchase-orders/${po.id}/receive`} class="btn btn-primary">Receive Items</a>
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
