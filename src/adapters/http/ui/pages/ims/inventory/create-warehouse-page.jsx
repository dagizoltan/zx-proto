import { h } from 'preact';

export const CreateWarehousePage = ({ user }) => {
  return (
    <div class="create-warehouse-page">
      <div class="page-header">
        <h1>Create Warehouse</h1>
      </div>

      <div class="card">
        <form method="POST" action="/ims/inventory/warehouses">
            <div class="form-group mb-4">
                <label>Name</label>
                <input type="text" name="name" required placeholder="Warehouse Name" />
            </div>

            <div class="form-group mb-4">
                <label>Code</label>
                <input type="text" name="code" required placeholder="WH-001" />
            </div>

            <div class="flex justify-end gap-2">
                <a href="/ims/inventory/warehouses" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary">Create Warehouse</button>
            </div>
        </form>
      </div>
    </div>
  );
};
