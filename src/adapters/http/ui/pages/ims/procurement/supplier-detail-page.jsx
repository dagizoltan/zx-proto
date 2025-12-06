import { h } from 'preact';

export const SupplierDetailPage = ({ user, supplier, purchaseOrders }) => {
  return (
    <div class="supplier-detail-page">
      <div class="page-header">
        <h1>{supplier.name}</h1>
        <div class="actions">
            <a href="/ims/suppliers" class="btn btn-secondary">Back to List</a>
            <button class="btn btn-primary">Edit Supplier</button>
        </div>
      </div>

      <div class="card">
        <h3>Supplier Information</h3>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="text-muted">Code</label>
                <div>{supplier.code}</div>
            </div>
            <div>
                <label class="text-muted">Email</label>
                <div>{supplier.email || '-'}</div>
            </div>
            <div>
                <label class="text-muted">Contact Person</label>
                <div>{supplier.contactName || '-'}</div>
            </div>
            <div>
                <label class="text-muted">Payment Terms</label>
                <div>{supplier.paymentTerms || '-'}</div>
            </div>
        </div>
      </div>

      <h3>Purchase Orders</h3>
      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {purchaseOrders.map(po => (
                        <tr>
                            <td><a href={`/ims/purchase-orders/${po.id}`}>{po.code}</a></td>
                            <td><span class={`badge badge-${po.status.toLowerCase()}`}>{po.status}</span></td>
                            <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                            <td>${po.totalCost.toFixed(2)}</td>
                            <td>
                                <a href={`/ims/purchase-orders/${po.id}`} class="btn btn-sm btn-secondary">View</a>
                            </td>
                        </tr>
                    ))}
                    {purchaseOrders.length === 0 && (
                        <tr><td colspan="5" class="text-center text-muted">No purchase orders found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
