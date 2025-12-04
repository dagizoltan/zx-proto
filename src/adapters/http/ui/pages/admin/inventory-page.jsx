import { h } from 'preact';

export const InventoryPage = ({ user, products }) => {
  return (
    <div class="inventory-page">
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1>Inventory Management</h1>
        <button class="btn btn-primary">Add Product</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
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
                <span class={product.quantity < 10 ? 'text-error' : ''}>
                  {product.quantity}
                </span>
              </td>
              <td>
                {product.quantity > 0 ? (
                  <span class="badge success">In Stock</span>
                ) : (
                  <span class="badge error">Out of Stock</span>
                )}
              </td>
              <td>
                <button class="btn btn-sm btn-secondary">Edit</button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colspan="6" style="text-align: center;">No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
