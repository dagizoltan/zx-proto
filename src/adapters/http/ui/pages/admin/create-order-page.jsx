import { h } from 'preact';

export const CreateOrderPage = ({ user, customers, products }) => {
  // Serialize data for client-side script
  const productOptions = products.map(p => `<option value="${p.id}">${p.name} (${p.sku}) - $${p.price.toFixed(2)}</option>`).join('');

  const scriptContent = `
    document.addEventListener('DOMContentLoaded', () => {
      const tableBody = document.querySelector('#items-table tbody');
      const addBtn = document.getElementById('add-item-btn');
      const productOptions = \`${productOptions}\`;
      let rowCount = 0;

      const addRow = () => {
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>
            <select name="items[\${rowCount}][productId]" required class="form-control product-select">
              <option value="">Select Product</option>
              \${productOptions}
            </select>
          </td>
          <td>
            <input type="number" name="items[\${rowCount}][quantity]" required min="1" value="1" class="form-control">
          </td>
          <td>
            <button type="button" class="btn-icon text-danger remove-row">&times;</button>
          </td>
        \`;
        tableBody.appendChild(tr);
        rowCount++;
      };

      // Add initial row
      addRow();

      addBtn.addEventListener('click', addRow);

      tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-row')) {
          e.target.closest('tr').remove();
        }
      });
    });
  `;

  return (
    <div class="create-order-page">
      <div class="header-actions">
        <h1>New Order</h1>
        <a href="/admin/orders" class="btn-secondary">Cancel</a>
      </div>

      <div class="card">
        <form method="POST" action="/admin/orders">
          <div class="form-group">
            <label>Customer</label>
            <select name="userId" required class="form-control">
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          <h3 style="margin-top: 2rem;">Order Items</h3>
          <div class="table-container">
            <table class="table-simple" id="items-table">
                <thead>
                <tr>
                    <th style="width: 60%">Product</th>
                    <th style="width: 20%">Quantity</th>
                    <th style="width: 10%">Action</th>
                </tr>
                </thead>
                <tbody>
                {/* Dynamic rows */}
                </tbody>
            </table>
          </div>

          <button type="button" class="btn-secondary btn-sm" id="add-item-btn" style="margin-top: 1rem;">+ Add Item</button>

          <div class="form-actions" style="margin-top: 2rem;">
            <button type="submit" class="btn-primary">Create Order</button>
          </div>
        </form>
      </div>

      <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
    </div>
  );
};
