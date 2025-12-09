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
          <h3>Category</h3>
          <div class="stat-value text-xl">{product.category}</div>
        </div>
      </div>

      <div class="card">
        <h2>Stock Movement History</h2>
        {movements && movements.length > 0 ? (
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantity</th>
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
                    <td class={isNegative(m.type) ? 'text-error font-bold' : 'text-success font-bold'}>
                      {isNegative(m.type) ? '-' : '+'}{m.quantity}
                    </td>
                    <td class="text-muted">{m.referenceId || m.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p class="text-muted">No stock movements recorded.</p>
        )}

        <PaginationControls nextCursor={nextCursor} currentUrl={currentUrl} />
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
