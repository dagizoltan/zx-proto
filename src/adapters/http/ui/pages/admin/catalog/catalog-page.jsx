import { h } from 'preact';
import { PaginationControls } from '../../../components/pagination.jsx';

export const CatalogPage = ({ user, products, nextCursor, currentUrl, query = '' }) => {
  return (
    <div>
      <div class="page-header">
        <h1>Catalog</h1>
        <div class="flex gap-2">
            <form method="GET" action="/admin/catalog" class="flex gap-2">
                <input
                    type="search"
                    name="q"
                    value={query}
                    placeholder="Search products..."
                    class="px-3 py-2 border rounded-md"
                />
                <button type="submit" class="btn btn-secondary">Search</button>
            </form>
            <a href="/admin/products/new" class="btn btn-primary">Add Product</a>
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
                        <th>Price</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id}>
                            <td class="font-mono text-sm">{product.id.slice(0, 8)}...</td>
                            <td class="font-mono text-sm">{product.sku}</td>
                            <td class="font-medium">{product.name}</td>
                            <td>
                                <span class="badge badge-neutral">{product.type || 'SIMPLE'}</span>
                            </td>
                            <td>${product.price.toFixed(2)}</td>
                            <td>{product.category || '-'}</td>
                            <td>
                                <span class={`badge ${product.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                                    {product.status}
                                </span>
                            </td>
                            <td>
                                <a href={`/admin/products/${product.id}`} class="btn btn-sm btn-secondary">View</a>
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
