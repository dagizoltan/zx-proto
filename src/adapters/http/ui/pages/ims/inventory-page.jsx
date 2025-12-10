import { h } from 'preact';
import { PaginationControls } from '../../components/pagination.jsx';

export const InventoryPage = ({ user, products, nextCursor, currentUrl }) => {
  return (
    <div class="inventory-page">
      <div class="page-header">
        <h1>Inventory Management</h1>
        <div class="actions flex gap-2">
            <a href="/ims/inventory/transfer" class="btn btn-secondary">Transfer Stock</a>
            <a href="/ims/inventory/receive" class="btn btn-primary">Receive Stock</a>
        </div>
      </div>

      <div class="flex gap-2 mb-6">
          <a href="/ims/inventory" class="btn btn-sm btn-primary">Stock Levels</a>
          <a href="/ims/inventory/movements" class="btn btn-sm btn-secondary">Movements Log</a>
          <a href="/ims/inventory/locations" class="btn btn-sm btn-secondary">Locations</a>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
            <h3>Products (Page)</h3>
            <div class="stat-value">{products.length}</div>
        </div>
        <div class="stat-card">
            <h3>Low Stock</h3>
            <div class="stat-value warn">{products.filter(p => p.quantity < 10).length}</div>
        </div>
        <div class="stat-card">
            <h3>Total Value (Page)</h3>
            <div class="stat-value">${products.reduce((acc, p) => acc + (p.price * p.quantity), 0).toFixed(2)}</div>
        </div>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Total Stock</th>
                    <th class="text-right">Reserved</th>
                    <th class="text-right">Available</th>
                    <th class="text-right">Actions</th>
                </tr>
                </thead>
                <tbody>
                {products.map(product => (
                    <tr>
                    <td class="font-mono text-sm">{product.sku}</td>
                    <td>{product.name}</td>
                    <td class="text-right">${product.price}</td>
                    <td class="text-right">
                        <span class={product.quantity < 10 ? 'text-error font-bold' : ''}>
                        {product.quantity}
                        </span>
                    </td>
                    <td class="text-right">{product.reservedQuantity || 0}</td>
                    <td class="text-right">{(product.quantity - (product.reservedQuantity || 0))}</td>
                    <td class="text-right">
                        <a href={`/ims/catalog/products/${product.id}`} class="btn btn-sm btn-secondary">View</a>
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
