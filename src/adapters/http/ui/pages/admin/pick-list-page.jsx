import { h } from 'preact';

export const PickListPage = ({ user, order, pickItems }) => {
  return (
    <div class="pick-list-page print-layout">
      <div class="header">
        <h1>Pick List</h1>
        <div class="meta">
            <p><strong>Order:</strong> #{order.id}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div class="instructions">
        <p>Please pick the following items in the order listed.</p>
      </div>

      <div class="table-container">
        <table class="table-compact">
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

      <style>{`
        .print-layout { max-width: 800px; margin: 0 auto; padding: 2rem; background: white; color: black; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 2rem; }
        .checkbox-box { width: 20px; height: 20px; border: 1px solid #000; }
        .table-compact th, .table-compact td { padding: 0.5rem; border-bottom: 1px solid #ddd; text-align: left; }
        @media print {
            body { background: white; }
            .print-layout { width: 100%; max-width: none; padding: 0; }
            .btn, .sidebar, .navbar { display: none !important; }
        }
      `}</style>

      <div class="actions no-print mt-8">
        <button onclick="window.print()" class="btn btn-primary">Print Pick List</button>
        <a href={`/admin/orders/${order.id}`} class="btn btn-secondary ml-4">Back to Order</a>
      </div>
    </div>
  );
};
