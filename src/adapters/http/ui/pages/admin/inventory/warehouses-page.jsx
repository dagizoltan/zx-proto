import { h } from 'preact';

export const WarehousesPage = ({ warehouses = [] }) => {
  return (
    <div>
      <div class="page-header">
        <h1>Warehouses</h1>
        <button class="btn btn-primary" id="btn-create-warehouse">Add Warehouse</button>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {warehouses.map(w => (
                        <tr key={w.id}>
                            <td class="font-mono">{w.code}</td>
                            <td class="font-medium">{w.name}</td>
                            <td class="text-muted">{new Date(w.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary">Manage Locations</button>
                            </td>
                        </tr>
                    ))}
                    {warehouses.length === 0 && (
                        <tr><td colspan="4" class="text-center text-muted">No warehouses found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Simple Create Modal Injection */}
      <dialog id="create-warehouse-dialog">
          <form id="create-warehouse-form">
              <div class="modal-header"><h3>Add Warehouse</h3></div>
              <div class="modal-body">
                  <div class="mb-4">
                      <label>Name</label>
                      <input type="text" name="name" required />
                  </div>
                  <div class="mb-4">
                      <label>Code</label>
                      <input type="text" name="code" required />
                  </div>
              </div>
              <div class="modal-footer">
                  <button type="button" id="cancel-warehouse-btn" class="btn btn-secondary">Cancel</button>
                  <button type="submit" class="btn btn-primary">Create</button>
              </div>
          </form>
      </dialog>

      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', () => {
            const btn = document.getElementById('btn-create-warehouse');
            const dialog = document.getElementById('create-warehouse-dialog');
            const cancel = document.getElementById('cancel-warehouse-btn');
            const form = document.getElementById('create-warehouse-form');

            if(btn && dialog) {
                btn.addEventListener('click', () => dialog.showModal());
                cancel.addEventListener('click', () => dialog.close());

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const data = {
                        name: formData.get('name'),
                        code: formData.get('code')
                    };

                    try {
                        const res = await fetch('/api/admin/warehouses', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(data)
                        });
                        if(res.ok) window.location.reload();
                        else alert('Failed to create warehouse');
                    } catch(e) {
                        console.error(e);
                        alert('Error');
                    }
                });
            }
        });
      `}} />
    </div>
  );
};
