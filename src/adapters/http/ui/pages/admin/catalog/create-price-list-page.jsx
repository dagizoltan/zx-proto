import { h } from 'preact';

export const CreatePriceListPage = ({ user }) => {
  return (
    <div class="create-price-list-page">
      <div class="page-header">
        <h1>Create Price List</h1>
      </div>

      <div class="card">
        <form method="POST" action="/admin/catalog/price-lists">
            <div class="form-group mb-4">
                <label>Name</label>
                <input type="text" name="name" required placeholder="e.g., VIP Customers" />
            </div>

            <div class="form-group mb-4">
                <label>Currency</label>
                <input type="text" name="currency" value="USD" required />
            </div>

            <div class="form-group mb-4">
                <label>Description</label>
                <textarea name="description" rows="3"></textarea>
            </div>

            <div class="flex justify-end gap-2">
                <a href="/admin/catalog/price-lists" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary">Create Price List</button>
            </div>
        </form>
      </div>
    </div>
  );
};
