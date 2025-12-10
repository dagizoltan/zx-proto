import { h } from 'preact';
import { PaginationControls } from '../../components/pagination.jsx';

export const ProductDetailPage = ({ user, product, movements, stock, nextCursor, currentUrl }) => {
  return (
    <div class="product-detail-page">
      <div class="page-header">
        <div>
            <h1>{product.name}</h1>
            <span class="entity-id">SKU: {product.sku}</span>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <h3>Current Stock</h3>
          <div class="stat-value">{stock}</div>
        </div>
        <div class="stat-card">
          <h3>Price</h3>
          <div class="stat-value">${product.price.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <h3>Total Value</h3>
          <div class="stat-value">${(stock * product.price).toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <h3>Category</h3>
          <div class="stat-value" style="font-size: 1.5rem;">{product.category}</div>
        </div>
      </div>

      <div class="card p-0">
        <div class="px-6 py-4 border-b border-white/5 bg-white/5">
           <h3 class="m-0 text-white font-semibold">Stock Movement History</h3>
        </div>
        {movements && movements.length > 0 ? (
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th class="text-right">Quantity</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr>
                    <td>{new Date(m.timestamp).toLocaleString()}</td>
                    <td>
                      <span class={`badge ${getTypeBadgeClass(m.type)}`}>{m.type}</span>
                    </td>
                    <td class={`text-right font-bold ${isNegative(m.type) ? 'text-error' : 'text-success'}`}>
                      {isNegative(m.type) ? '-' : '+'}{m.quantity}
                    </td>
                    <td class="text-muted">{m.referenceId || m.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div class="p-4 text-muted">No stock movements recorded.</div>
        )}

        {movements && movements.length > 0 && (
            <div class="p-4 border-t border-white/5">
                <PaginationControls nextCursor={nextCursor} currentUrl={currentUrl} />
            </div>
        )}
      </div>
    </div>
  );
};

const getTypeBadgeClass = (type) => {
    switch (type) {
        case 'received': return 'badge-success';
        case 'allocated': return 'badge-warning';
        case 'shipped': return 'badge-primary'; // Or info
        case 'released': return 'badge-neutral';
        default: return 'badge-neutral';
    }
};

const isNegative = (type) => type === 'shipped' || type === 'allocated';
