import { h } from 'preact';
import { PaginationControls } from '../../../components/pagination.jsx';

export const CatalogPage = ({ user, products, nextCursor, currentUrl, query = '' }) => {
  return (
    <div class="catalog-page">
      <div class="page-header">
        <h1>Catalog</h1>
        <div class="flex gap-2 items-center">
            <form method="GET" action="/ims/catalog/products" class="flex gap-2">
                <input
                    type="search"
                    name="q"
                    value={query}
                    placeholder="Search products..."
                    class="w-200px"
                />
                <button type="submit" class="btn btn-secondary">Search</button>
            </form>
            <a href="/ims/catalog/products/new" class="btn btn-primary">Add Product</a>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
            <h3>Products on Page</h3>
            <div class="stat-value">{products.length}</div>
        </div>
        <div class="stat-card">
            <h3>Active</h3>
            <div class="stat-value">{products.filter(p => p.status === 'ACTIVE').length}</div>
        </div>
        <div class="stat-card">
            <h3>Low Stock</h3>
            <div class="stat-value warn">{products.filter(p => p.quantity < 10).length}</div>
        </div>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>SKU</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th class="text-right">Price</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th class="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id}>
                            <td class="font-mono text-sm">
                                <a href={`/ims/catalog/products/${product.id}`}>{product.id.slice(0, 8)}...</a>
                            </td>
                            <td class="font-mono text-sm">{product.sku}</td>
                            <td class="font-bold text-white">{product.name}</td>
                            <td>
                                <span class="badge badge-neutral">{product.type || 'SIMPLE'}</span>
                            </td>
                            <td class="text-right">${product.price.toFixed(2)}</td>
                            <td>{product.category || '-'}</td>
                            <td>
                                <span class={`badge ${product.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                                    {product.status}
                                </span>
                            </td>
                            <td class="text-right">
                                <a href={`/ims/catalog/products/${product.id}`} class="btn btn-sm btn-secondary">View</a>
                            </td>
                        </tr>
                    ))}
                    {products.length === 0 && (
                        <tr><td colspan="8" class="text-center text-muted">No products found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <PaginationControls nextCursor={nextCursor} currentUrl={currentUrl} />
    </div>
  );
};
