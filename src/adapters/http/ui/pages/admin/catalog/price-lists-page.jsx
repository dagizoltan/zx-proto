import { h } from 'preact';

export const PriceListsPage = ({ user, priceLists = [] }) => {
  return (
    <div class="price-lists-page">
      <div class="page-header">
        <h1>Price Lists</h1>
        <a href="/admin/price-lists/new" class="btn btn-primary">Create Price List</a>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Currency</th>
                <th>Prices Defined</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {priceLists.length > 0 ? (
                priceLists.map(pl => (
                  <tr>
                    <td class="font-mono text-sm">{pl.id.slice(0, 8)}...</td>
                    <td>{pl.name}</td>
                    <td>{pl.currency}</td>
                    <td>{Object.keys(pl.prices || {}).length}</td>
                    <td>{new Date(pl.createdAt).toLocaleDateString()}</td>
                    <td>
                        <a href={`/admin/price-lists/${pl.id}`} class="btn btn-sm btn-secondary">View</a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colspan="6" class="text-center py-4">No price lists found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
