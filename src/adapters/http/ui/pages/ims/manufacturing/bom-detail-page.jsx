import { h } from 'preact';

export const BOMDetailPage = ({ user, bom }) => {
  return (
    <div class="bom-detail-page">
      <div class="page-header">
        <h1>{bom.name}</h1>
        <div class="actions">
            <a href="/ims/boms" class="btn btn-secondary">Back to List</a>
            <a href="/ims/work-orders/new" class="btn btn-primary">Create Work Order</a>
        </div>
      </div>

      <div class="card mb-6">
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="text-muted">Finished Product</label>
                <div class="font-bold text-lg">{bom.productName}</div>
            </div>
            <div>
                <label class="text-muted">Estimated Labor Cost</label>
                <div>${(bom.laborCost || 0).toFixed(2)}</div>
            </div>
        </div>
      </div>

      <h3>Components (Raw Materials)</h3>
      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Component</th>
                        <th>Quantity Required</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {bom.components.map(comp => (
                        <tr>
                            <td>
                                <div>{comp.productName || 'Unknown Product'}</div>
                                <small class="text-muted">{comp.sku}</small>
                            </td>
                            <td>{comp.quantity}</td>
                            <td>{comp.notes || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
