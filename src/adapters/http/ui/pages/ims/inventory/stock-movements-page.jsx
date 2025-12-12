import { h } from 'preact';
import { PaginationControls } from '../../../components/pagination.jsx';

export const StockMovementsPage = ({ user, movements, nextCursor, currentUrl, query = '' }) => {
  return (
    <div class="stock-movements-page">
      <div class="page-header">
        <h1>Stock Movements</h1>
        <div class="flex gap-2 items-center">
            <form method="GET" action="/ims/inventory/movements" class="flex gap-2">
                <input
                    type="search"
                    name="q"
                    value={query}
                    placeholder="Search reference, SKU..."
                    class="w-200px"
                />
                <button type="submit" class="btn btn-secondary">Search</button>
            </form>
        </div>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Reference</th>
                        <th>Location</th>
                        <th>Batch</th>
                    </tr>
                </thead>
                <tbody>
                    {movements.map(m => (
                        <tr key={m.id}>
                            <td class="text-sm text-muted">
                                {new Date(m.timestamp).toLocaleString()}
                            </td>
                            <td>
                                <span class={`badge ${
                                    m.type === 'RECEIPT' || m.type === 'PRODUCTION_OUTPUT' ? 'badge-success' :
                                    m.type === 'SHIPMENT' || m.type === 'PRODUCTION_INPUT' ? 'badge-warn' :
                                    'badge-neutral'
                                }`}>
                                    {m.type}
                                </span>
                            </td>
                            <td>
                                {m.productName}
                                <div class="text-xs text-muted font-mono">{m.sku}</div>
                            </td>
                            <td class={`font-mono text-right ${m.quantity > 0 ? 'text-success' : 'text-danger'}`}>
                                {m.quantity > 0 ? '+' : ''}{m.quantity}
                            </td>
                            <td class="font-mono text-sm">{m.referenceId || '-'}</td>
                            <td class="text-sm">{m.locationCode || '-'}</td>
                            <td class="font-mono text-xs">{m.batchNumber || '-'}</td>
                        </tr>
                    ))}
                    {movements.length === 0 && (
                        <tr><td colspan="7" class="text-center text-muted">No movements found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <PaginationControls nextCursor={nextCursor} currentUrl={currentUrl} />
    </div>
  );
};
