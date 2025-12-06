import { h } from 'preact';

export const CreateOrderPage = ({ user, customers, products, error, values = {} }) => {
  // Serialize data for client-side script
  const productOptions = products.map(p => `<option value="${p.id}">${p.name} (${p.sku}) - $${p.price.toFixed(2)}</option>`).join('');

  // Safe serialization for previous items
  const initialItems = values.items && values.items.length > 0 ? JSON.stringify(values.items) : '[]';

  const scriptContent = `
    document.addEventListener('DOMContentLoaded', () => {
      const tableBody = document.querySelector('#items-table tbody');
      const addBtn = document.getElementById('add-item-btn');
      const productOptions = \`${productOptions}\`;

      // Read safely from JSON script tag
      const initialItemsData = document.getElementById('initial-items-data').textContent;
      const initialItems = JSON.parse(initialItemsData);

      let rowCount = 0;

      const addRow = (item = null) => {
        const tr = document.createElement('tr');

        tr.innerHTML = \`
          <td>
            <select name="items[\${rowCount}][productId]" required class="form-control product-select">
              <option value="">Select Product</option>
              \${productOptions}
            </select>
          </td>
          <td>
            <input type="number" name="items[\${rowCount}][quantity]" required min="1" value="\${item ? item.quantity : 1}" class="form-control">
          </td>
          <td>
            <button type="button" class="btn-icon text-danger remove-row">&times;</button>
          </td>
        \`;
        tableBody.appendChild(tr);

        // Set selected value
        if (item) {
            const select = tr.querySelector('select');
            select.value = item.productId;
        }

        rowCount++;
      };

      // Add initial rows or default
      if (initialItems.length > 0) {
          initialItems.forEach(item => addRow(item));
      } else {
          addRow();
      }

      addBtn.addEventListener('click', () => addRow());

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
        <a href="/ims/orders" class="btn-secondary">Cancel</a>
      </div>

      <div class="card">
        {error && (
            <div class="alert alert-danger mb-4">
                {error}
            </div>
        )}
        <form method="POST" action="/ims/orders">
          <div class="form-group">
            <label>Customer</label>
            <select name="userId" required class="form-control">
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option value={c.id} selected={values.userId === c.id}>{c.name} ({c.email})</option>
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

      {/* Safe Data Injection */}
      <script type="application/json" id="initial-items-data" dangerouslySetInnerHTML={{ __html: initialItems }} />
      <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
    </div>
  );
};
