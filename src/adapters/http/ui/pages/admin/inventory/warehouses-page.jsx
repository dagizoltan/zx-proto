import { h } from 'preact';

export const WarehousesPage = ({ warehouses = [] }) => {
  return (
    <div>
      <div class="page-header">
        <h1>Warehouses</h1>
        <a href="/admin/warehouses/new" class="btn btn-primary">Add Warehouse</a>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {warehouses.map(w => (
                        <tr key={w.id}>
                            <td class="font-mono text-sm">{w.id.slice(0, 8)}...</td>
                            <td class="font-mono">{w.code}</td>
                            <td class="font-medium">{w.name}</td>
                            <td class="text-muted">{new Date(w.createdAt).toLocaleDateString()}</td>
                            <td>
                                <a href={`/admin/warehouses/${w.id}`} class="btn btn-sm btn-secondary">View</a>
                            </td>
                        </tr>
                    ))}
                    {warehouses.length === 0 && (
                        <tr><td colspan="5" class="text-center text-muted">No warehouses found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
