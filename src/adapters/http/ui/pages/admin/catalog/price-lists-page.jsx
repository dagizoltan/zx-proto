import { h } from 'preact';

export const PriceListsPage = ({ user, priceLists = [] }) => {
  return (
    <div class="price-lists-page">
      <div class="page-header">
        <div>
          <h1>Price Lists</h1>
          <p class="text-muted">Manage custom pricing strategies</p>
        </div>
        <button class="btn btn-primary" onclick="document.getElementById('create-pl-dialog').showModal()">
          Create Price List
        </button>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Currency</th>
                <th>Prices Defined</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {priceLists.length > 0 ? (
                priceLists.map(pl => (
                  <tr>
                    <td>{pl.name}</td>
                    <td>{pl.currency}</td>
                    <td>{Object.keys(pl.prices || {}).length}</td>
                    <td>{new Date(pl.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colspan="4" class="text-center py-4">No price lists found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog id="create-pl-dialog">
        <div class="modal-header">
          <h3>Create Price List</h3>
          <button class="btn-close" onclick="document.getElementById('create-pl-dialog').close()">×</button>
        </div>
        <form method="POST" action="/admin/price-lists">
          <div class="modal-body">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" required placeholder="e.g., VIP Customers" />
            </div>
            <div class="form-group">
              <label for="currency">Currency</label>
              <input type="text" id="currency" name="currency" value="USD" required />
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('create-pl-dialog').close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create</button>
          </div>
        </form>
      </dialog>
    </div>
  );
};
