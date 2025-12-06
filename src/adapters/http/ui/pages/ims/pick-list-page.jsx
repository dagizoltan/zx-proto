import { h } from 'preact';

export const PickListPage = ({ user, order, pickItems }) => {
  return (
    <div class="pick-list-page">
      <div class="page-header">
        <div class="flex items-center gap-4">
            <h1>Pick List #{order.id}</h1>
            <span class="badge badge-neutral text-base font-normal">Date: {new Date().toLocaleDateString()}</span>
        </div>
        <div class="flex gap-2 no-print">
            <button onclick="window.print()" class="btn btn-primary">Print Pick List</button>
            <a href={`/ims/orders/${order.id}`} class="btn btn-secondary">Back to Order</a>
        </div>
      </div>

      <div class="card mb-6">
        <h3>Instructions</h3>
        <p class="m-0">Please pick the following items in the order listed.</p>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
            <thead>
                <tr>
                <th>Location</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Batch</th>
                <th>Qty</th>
                <th>Check</th>
                </tr>
            </thead>
            <tbody>
                {pickItems.map(item => (
                <tr>
                    <td class="font-mono font-bold">{item.locationCode}</td>
                    <td>{item.productName}</td>
                    <td>{item.sku}</td>
                    <td>
                        {item.batchNumber && (
                            <div>
                                <span class="text-sm">{item.batchNumber}</span>
                                {item.expiryDate && <div class="text-xs text-muted">Exp: {new Date(item.expiryDate).toLocaleDateString()}</div>}
                            </div>
                        )}
                    </td>
                    <td class="text-lg font-bold">{item.quantity}</td>
                    <td><div class="checkbox-box"></div></td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      <style>{`
        .checkbox-box { width: 20px; height: 20px; border: 1px solid #000; }
        @media print {
            .admin-sidebar, .admin-header, .no-print { display: none !important; }
            .admin-content { padding: 0 !important; margin: 0 !important; overflow: visible !important; }
            .card { box-shadow: none !important; border: none !important; margin-bottom: 1rem !important; padding: 0 !important; }
            .page-header { margin-bottom: 1rem !important; }
            body { background-color: white !important; }
            .pick-list-page { width: 100%; }
        }
      `}</style>
    </div>
  );
};
