export const CreatePurchaseOrderPage = ({ user, suppliers, products, activePage, layout, title }) => {
  return layout({
    user,
    activePage,
    title,
    content: `
      <div class="header-actions">
        <h1>New Purchase Order</h1>
        <a href="/admin/purchase-orders" class="btn-secondary">Cancel</a>
      </div>

      <div class="card">
        <form method="POST" action="/admin/purchase-orders">
          <div class="form-row">
            <div class="form-group">
              <label>Supplier</label>
              <select name="supplierId" required>
                <option value="">Select Supplier</option>
                ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Expected Date</label>
              <input type="date" name="expectedDate">
            </div>
          </div>

          <h3>Items</h3>
          <table class="table-simple" id="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <!-- Dynamic rows will go here -->
            </tbody>
          </table>

          <button type="button" class="btn-secondary btn-sm" id="add-item-btn" style="margin-top: 1rem;">+ Add Item</button>

          <div class="form-actions" style="margin-top: 2rem;">
            <button type="submit" class="btn-primary">Create Purchase Order</button>
          </div>
        </form>
      </div>

      <template id="product-options">
        ${products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('')}
      </template>

      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const tableBody = document.querySelector('#items-table tbody');
          const addBtn = document.getElementById('add-item-btn');
          const productOptions = document.getElementById('product-options').innerHTML;
          let rowCount = 0;

          const addRow = () => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td>
                <select name="items[\${rowCount}][productId]" required class="form-control">
                  <option value="">Select Product</option>
                  \${productOptions}
                </select>
              </td>
              <td>
                <input type="number" name="items[\${rowCount}][quantity]" required min="1" value="1" class="form-control">
              </td>
              <td>
                <input type="number" name="items[\${rowCount}][unitCost]" required min="0" step="0.01" value="0.00" class="form-control">
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
      </script>
    `
  });
};
