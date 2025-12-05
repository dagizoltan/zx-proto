import { h } from 'preact';

export const WarehouseDetailPage = ({ user, warehouse, locations = [] }) => {
  return (
    <div class="warehouse-detail-page">
      <div class="page-header">
        <h1>{warehouse.name}</h1>
        <div class="flex gap-2">
            <a href="/admin/inventory/warehouses" class="btn btn-secondary">Back to List</a>
        </div>
      </div>

      <div class="card mb-4">
        <h3>Details</h3>
        <dl class="grid grid-cols-2 gap-4">
            <div>
                <dt class="text-muted text-sm">ID</dt>
                <dd class="font-mono">{warehouse.id}</dd>
            </div>
            <div>
                <dt class="text-muted text-sm">Code</dt>
                <dd class="font-mono">{warehouse.code}</dd>
            </div>
        </dl>
      </div>

      <div class="card p-0">
          <div class="p-4 border-b">
              <h3>Locations</h3>
          </div>
          <div class="table-container">
              <table>
                  <thead>
                      <tr>
                          <th>ID</th>
                          <th>Code</th>
                          <th>Type</th>
                          <th>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {locations.map(loc => (
                          <tr>
                              <td class="font-mono text-sm">{loc.id.slice(0, 8)}...</td>
                              <td>{loc.code}</td>
                              <td>{loc.type || 'Standard'}</td>
                              <td>
                                  <a href={`/admin/inventory/locations/${loc.id}`} class="btn btn-sm btn-secondary">View</a>
                              </td>
                          </tr>
                      ))}
                      {locations.length === 0 && (
                          <tr><td colspan="4" class="text-center text-muted p-4">No locations found in this warehouse.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};
