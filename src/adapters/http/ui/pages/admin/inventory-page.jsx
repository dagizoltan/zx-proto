import { h } from 'preact';

export const InventoryPage = ({ user, products }) => {
  return (
    <div class="inventory-page">
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1>Inventory Management</h1>
        <div class="actions">
            <button class="btn btn-secondary" style="margin-right: 1rem;">Transfer Stock</button>
            <button class="btn btn-primary">Receive Stock</button>
        </div>
      </div>

      <div class="tabs" style="margin-bottom: 1rem;">
          <button class="btn btn-sm btn-secondary active">Stock Levels</button>
          <button class="btn btn-sm btn-secondary">Movements Log</button>
      </div>

      <table class="data-table">
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
                <span class={product.quantity < 10 ? 'text-error' : ''}>
                  {product.quantity}
                </span>
              </td>
              <td>{product.reservedQuantity || 0}</td>
              <td>{(product.quantity - (product.reservedQuantity || 0))}</td>
              <td>
                <button class="btn btn-sm btn-secondary">View Locs</button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colspan="7" style="text-align: center;">No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
