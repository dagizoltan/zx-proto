import { h } from 'preact';

export const LocationsPage = ({ locations = [], warehouses = [] }) => {
  return (
    <div>
      <div class="page-header">
        <h1>Locations</h1>
        <a href="/ims/inventory/locations/new" class="btn btn-primary">Add Location</a>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Warehouse</th>
                        <th>Parent</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {locations.map(l => {
                        const wh = warehouses.find(w => w.id === l.warehouseId);
                        const parent = locations.find(p => p.id === l.parentId);
                        return (
                            <tr key={l.id}>
                                <td class="font-mono text-sm">{l.id.slice(0, 8)}...</td>
                                <td class="font-mono">{l.code}</td>
                                <td><span class="badge badge-neutral">{l.type}</span></td>
                                <td>{wh ? wh.name : l.warehouseId}</td>
                                <td class="text-muted">{parent ? parent.code : '-'}</td>
                                <td>
                                    <a href={`/ims/inventory/locations/${l.id}`} class="btn btn-sm btn-secondary">View</a>
                                </td>
                            </tr>
                        );
                    })}
                    {locations.length === 0 && (
                        <tr><td colspan="6" class="text-center text-muted">No locations found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
