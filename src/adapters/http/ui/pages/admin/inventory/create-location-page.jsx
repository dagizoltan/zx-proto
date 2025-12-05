import { h } from 'preact';

export const CreateLocationPage = ({ user, warehouses, locations }) => {
  return (
    <div class="create-location-page">
      <div class="page-header">
        <h1>Create Location</h1>
      </div>

      <div class="card">
        <form method="POST" action="/admin/inventory/locations">
            <div class="form-group mb-4">
                <label>Code</label>
                <input type="text" name="code" required placeholder="A1-01" />
            </div>

            <div class="form-group mb-4">
                <label>Type</label>
                <select name="type">
                    <option value="SHELF">Shelf</option>
                    <option value="BIN">Bin</option>
                    <option value="AISLE">Aisle</option>
                    <option value="ZONE">Zone</option>
                    <option value="PALLET">Pallet</option>
                </select>
            </div>

            <div class="form-group mb-4">
                <label>Warehouse</label>
                <select name="warehouseId" required>
                    {warehouses.map(w => <option value={w.id}>{w.name}</option>)}
                </select>
            </div>

            <div class="form-group mb-4">
                <label>Parent Location (Optional)</label>
                <select name="parentId">
                    <option value="">None</option>
                    {locations.map(l => <option value={l.id}>{l.code}</option>)}
                </select>
            </div>

            <div class="flex justify-end gap-2">
                <a href="/admin/inventory/locations" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary">Create Location</button>
            </div>
        </form>
      </div>
    </div>
  );
};
