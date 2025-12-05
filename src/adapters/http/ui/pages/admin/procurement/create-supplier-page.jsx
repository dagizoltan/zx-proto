import { h } from 'preact';

export const CreateSupplierPage = ({ user }) => {
  return (
    <div class="create-supplier-page">
      <div class="page-header">
        <h1>Add New Supplier</h1>
      </div>

      <div class="card">
        <form method="POST" action="/admin/procurement/suppliers">
            <div class="form-group mb-4">
              <label>Name</label>
              <input type="text" name="name" required placeholder="Acme Corp" />
            </div>
            <div class="form-group mb-4">
              <label>Code</label>
              <input type="text" name="code" required placeholder="SUP-001" />
            </div>
            <div class="form-group mb-4">
              <label>Contact Name</label>
              <input type="text" name="contactName" placeholder="John Doe" />
            </div>
            <div class="form-group mb-4">
              <label>Email</label>
              <input type="email" name="email" placeholder="supplier@example.com" />
            </div>

            <div class="flex justify-end gap-2">
                <a href="/admin/procurement/suppliers" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary">Create Supplier</button>
            </div>
        </form>
      </div>
    </div>
  );
};
