import { h } from 'preact';

export const SuppliersPage = ({ user, suppliers }) => {
  return (
    <div class="suppliers-page">
      <div class="page-header">
        <h1>Suppliers</h1>
        <a href="/ims/suppliers/new" class="btn btn-primary">Add Supplier</a>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Code</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr>
                  <td class="font-mono text-sm">{s.id.slice(0, 8)}...</td>
                  <td><a href={`/ims/suppliers/${s.id}`}>{s.name}</a></td>
                  <td>{s.code}</td>
                  <td>{s.contactName || '-'}</td>
                  <td>{s.email || '-'}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <a href={`/ims/suppliers/${s.id}`} class="btn btn-sm btn-secondary">View</a>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colspan="7" class="text-center">No suppliers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
