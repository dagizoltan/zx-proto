import { h } from 'preact';
import { PaginationControls } from '../../components/pagination.jsx';

export const InventoryPage = ({ user, products, nextCursor, currentUrl }) => {
  return (
    <div class="inventory-page">
      <div class="page-header">
        <h1>Inventory Management</h1>
        <div class="actions">
            <button class="btn btn-secondary" style="margin-right: 0.5rem;">Transfer Stock</button>
            <button class="btn btn-primary">Receive Stock</button>
        </div>
      </div>

      <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem;">
          <button class="btn btn-sm btn-secondary active">Stock Levels</button>
          <button class="btn btn-sm btn-secondary">Movements Log</button>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Total Stock</th>
                    <th>Reserved</th>
                    <th>Available</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {products.map(product => (
                    <tr>
                    <td>{product.sku}</td>
                    <td>{product.name}</td>
                    <td>${product.price}</td>
                    <td>
                        <span class={product.quantity < 10 ? 'text-error font-bold' : ''}>
                        {product.quantity}
                        </span>
                    </td>
                    <td>{product.reservedQuantity || 0}</td>
                    <td>{(product.quantity - (product.reservedQuantity || 0))}</td>
                    <td>
                        <a href={`/ims/products/${product.id}`} class="btn btn-sm btn-secondary">View Details</a>
                    </td>
                    </tr>
                ))}
                {products.length === 0 && (
                    <tr>
                    <td colspan="7" class="text-center text-muted">No products found.</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
      </div>

      <PaginationControls nextCursor={nextCursor} currentUrl={currentUrl} />
    </div>
  );
};
