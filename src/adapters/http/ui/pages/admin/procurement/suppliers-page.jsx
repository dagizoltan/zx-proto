import { h } from 'preact';

export const SuppliersPage = ({ user, suppliers }) => {
  return (
    <div class="suppliers-page">
      <div class="header-actions">
        <h1>Suppliers</h1>
        <button class="btn-primary" onclick="document.getElementById('create-supplier-modal').showModal()">Add Supplier</button>
      </div>

      <div class="card">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr>
                  <td>{s.name}</td>
                  <td>{s.code}</td>
                  <td>{s.contactName || '-'}</td>
                  <td>{s.email || '-'}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colspan="5" class="text-center">No suppliers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog id="create-supplier-modal" class="modal">
        <form method="POST" action="/admin/suppliers">
          <div class="modal-header">
            <h3>Add New Supplier</h3>
            <button type="button" class="btn-icon" onclick="this.closest('dialog').close()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Name</label>
              <input type="text" name="name" required placeholder="Acme Corp" />
            </div>
            <div class="form-group">
              <label>Code</label>
              <input type="text" name="code" required placeholder="SUP-001" />
            </div>
            <div class="form-group">
              <label>Contact Name</label>
              <input type="text" name="contactName" placeholder="John Doe" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" placeholder="supplier@example.com" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="this.closest('dialog').close()">Cancel</button>
            <button type="submit" class="btn-primary">Create Supplier</button>
          </div>
        </form>
      </dialog>
    </div>
  );
};
