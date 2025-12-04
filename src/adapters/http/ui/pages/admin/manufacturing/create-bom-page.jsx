export const CreateBOMPage = ({ user, products, activePage, title }) => {
  return `
      <div class="header-actions">
        <h1>New Bill of Materials</h1>
        <a href="/admin/boms" class="btn-secondary">Cancel</a>
      </div>

      <div class="card">
        <form method="POST" action="/admin/boms">
          <div class="form-group">
            <label>Name</label>
            <input type="text" name="name" required placeholder="e.g. Standard Table Assembly">
          </div>

          <div class="form-group">
            <label>Finished Product</label>
            <select name="productId" required>
              <option value="">Select Product to Manufacture</option>
              ${products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Estimated Labor Cost</label>
            <input type="number" name="laborCost" step="0.01" min="0" value="0.00">
          </div>

          <h3>Components (Raw Materials)</h3>
          <table class="table-simple" id="components-table">
            <thead>
              <tr>
                <th>Component Product</th>
                <th>Quantity Required</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <!-- Dynamic rows -->
            </tbody>
          </table>

          <button type="button" class="btn-secondary btn-sm" id="add-component-btn" style="margin-top: 1rem;">+ Add Component</button>

          <div class="form-actions" style="margin-top: 2rem;">
            <button type="submit" class="btn-primary">Create BOM</button>
          </div>
        </form>
      </div>

      <template id="product-options">
        ${products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('')}
      </template>

      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const tableBody = document.querySelector('#components-table tbody');
          const addBtn = document.getElementById('add-component-btn');
          const productOptions = document.getElementById('product-options').innerHTML;
          let rowCount = 0;

          const addRow = () => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td>
                <select name="components[\${rowCount}][productId]" required class="form-control">
                  <option value="">Select Component</option>
                  \${productOptions}
                </select>
              </td>
              <td>
                <input type="number" name="components[\${rowCount}][quantity]" required min="1" value="1" class="form-control">
              </td>
              <td>
                <button type="button" class="btn-icon text-danger remove-row">&times;</button>
              </td>
            \`;
            tableBody.appendChild(tr);
            rowCount++;
          };

          addRow();

          addBtn.addEventListener('click', addRow);

          tableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-row')) {
              e.target.closest('tr').remove();
            }
          });
        });
      </script>
  `;
};
