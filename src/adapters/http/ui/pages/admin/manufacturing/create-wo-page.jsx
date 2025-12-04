export const CreateWorkOrderPage = ({ user, boms, activePage, title }) => {
  return `
      <div class="header-actions">
        <h1>New Work Order</h1>
        <a href="/admin/work-orders" class="btn-secondary">Cancel</a>
      </div>

      <div class="card">
        <form method="POST" action="/admin/work-orders">
          <div class="form-group">
            <label>Work Order Code</label>
            <input type="text" name="code" placeholder="Auto-generated if empty">
          </div>

          <div class="form-group">
            <label>Bill of Materials (Recipe)</label>
            <select name="bomId" required>
              <option value="">Select BOM</option>
              ${boms.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Quantity to Produce</label>
            <input type="number" name="quantity" required min="1" value="1">
          </div>

          <div class="form-group">
            <label>Start Date</label>
            <input type="date" name="startDate" value="${new Date().toISOString().split('T')[0]}">
          </div>

          <div class="form-actions" style="margin-top: 2rem;">
            <button type="submit" class="btn-primary">Create Work Order</button>
          </div>
        </form>
      </div>
  `;
};
