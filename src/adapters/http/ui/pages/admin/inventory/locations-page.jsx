import { h } from 'preact';

export const LocationsPage = ({ locations = [], warehouses = [] }) => {
  return (
    <div>
      <div class="page-header">
        <h1>Locations</h1>
        <button class="btn btn-primary" id="btn-create-location">Add Location</button>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
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
                                <td class="font-mono">{l.code}</td>
                                <td><span class="badge badge-neutral">{l.type}</span></td>
                                <td>{wh ? wh.name : l.warehouseId}</td>
                                <td class="text-muted">{parent ? parent.code : '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary">Edit</button>
                                </td>
                            </tr>
                        );
                    })}
                    {locations.length === 0 && (
                        <tr><td colspan="5" class="text-center text-muted">No locations found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
