import { h } from 'preact';

export const CompleteWorkOrderPage = ({ user, wo, locations }) => {
  return (
    <div class="complete-wo-page">
      <div class="header-actions">
        <h1>Complete Work Order: {wo.code}</h1>
        <a href="/admin/manufacturing/work-orders" class="btn-secondary">Cancel</a>
      </div>

      <div class="card">
        <div class="alert alert-info">
            Completing this work order will deduct raw materials and add finished goods to the selected location.
        </div>

        <form method="POST" action={`/admin/manufacturing/work-orders/${wo.id}/complete`}>

          <div class="form-group">
             <label>Finished Good</label>
             <input type="text" value={wo.productName} disabled />
          </div>

          <div class="form-group">
             <label>Quantity Produced</label>
             <input type="number" value={wo.quantity} disabled />
          </div>

          <div class="form-group">
            <label>Input Location (Raw Materials)</label>
            <select name="inputLocationId">
              <option value="">Same as Output Location (Default)</option>
              {locations.map(l => <option value={l.id}>{l.code} ({l.type})</option>)}
            </select>
            <small>Where raw materials will be consumed from.</small>
          </div>

          <div class="form-group">
            <label>Output Location (Finished Goods)</label>
            <select name="locationId" required>
              <option value="">Select Location</option>
              {locations.map(l => <option value={l.id}>{l.code} ({l.type})</option>)}
            </select>
            <small>Where finished goods will be stored.</small>
          </div>

          <div class="form-actions" style="margin-top: 2rem;">
            <button type="submit" class="btn-primary">Confirm Completion</button>
          </div>
        </form>
      </div>
    </div>
  );
};
