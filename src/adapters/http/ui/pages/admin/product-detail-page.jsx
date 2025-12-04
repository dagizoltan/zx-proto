import { h } from 'preact';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { PaginationControls } from '../../components/pagination.jsx';

export const ProductDetailPage = ({ user, product, movements, stock, nextCursor, currentUrl }) => {
  return (
    <div class="product-detail-page">
      <div class="header">
        <h1>{product.name}</h1>
        <span class="sku">{product.sku}</span>
      </div>

      <div class="product-summary">
        <div class="card">
          <h3>Current Stock</h3>
          <div class="value">{stock}</div>
        </div>
        <div class="card">
          <h3>Price</h3>
          <div class="value">${product.price.toFixed(2)}</div>
        </div>
        <div class="card">
          <h3>Category</h3>
          <div class="value">{product.category}</div>
        </div>
      </div>

      <div class="movements-section">
        <h2>Stock Movement History</h2>
        {movements && movements.length > 0 ? (
          <table class="movements-table">
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
                    <span class={`type-badge ${m.type}`}>{m.type}</span>
                  </td>
                  <td class={m.type === 'shipped' || m.type === 'allocated' ? 'negative' : 'positive'}>
                    {m.type === 'shipped' || m.type === 'allocated' ? '-' : '+'}{m.quantity}
                  </td>
                  <td>{m.referenceId || m.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No stock movements recorded.</p>
        )}

        <PaginationControls nextCursor={nextCursor} currentUrl={currentUrl} />
      </div>

      <style>{`
        .product-detail-page { max-width: 900px; margin: 0 auto; }
        .header { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 2rem; }
        .sku { color: #6b7280; font-family: monospace; font-size: 1.25rem; }

        .product-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
        .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card h3 { margin: 0 0 0.5rem 0; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; }
        .value { font-size: 1.5rem; font-weight: bold; color: #111827; }

        .movements-section { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .movements-table { width: 100%; border-collapse: collapse; }
        .movements-table th, .movements-table td { text-align: left; padding: 1rem; border-bottom: 1px solid #e5e7eb; }

        .type-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; text-transform: capitalize; }
        .type-badge.received { background: #d1fae5; color: #065f46; }
        .type-badge.allocated { background: #fef3c7; color: #92400e; }
        .type-badge.shipped { background: #dbeafe; color: #1e40af; }
        .type-badge.released { background: #f3f4f6; color: #374151; }

        .negative { color: #dc2626; font-weight: 600; }
        .positive { color: #059669; font-weight: 600; }
      `}</style>
    </div>
  );
};
