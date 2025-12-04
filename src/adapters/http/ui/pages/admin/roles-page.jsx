import { h } from 'preact';

export const RolesPage = (props) => {
  const roles = props.roles || [];

  return (
    <div>
      <div class="page-header">
        <h1>Roles Management</h1>
      </div>

      {/* Create Role */}
      <div class="card">
        <h3>Create New Role</h3>
        <form id="create-role-form" class="flex gap-4">
            <input
                type="text"
                name="name"
                placeholder="Role Name (e.g. Warehouse Manager)"
                required
            />
            <button type="submit" class="btn btn-primary">Create Role</button>
        </form>
      </div>

      {/* List Roles */}
      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Role Name</th>
                        <th>Permissions</th>
                        <th>ID</th>
                    </tr>
                </thead>
                <tbody>
                    {roles.map(role => (
                        <tr key={role.id}>
                            <td class="font-medium">{role.name}</td>
                            <td class="text-muted">
                                {role.permissions && role.permissions.length > 0 ? JSON.stringify(role.permissions) : 'No specific permissions'}
                            </td>
                            <td class="text-muted text-sm">{role.id}</td>
                        </tr>
                    ))}
                    {roles.length === 0 && (
                        <tr><td colspan="3" class="text-center text-muted">No roles found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('create-role-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const name = formData.get('name');

                    try {
                        const res = await fetch('/api/admin/roles', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: name, permissions: [] })
                        });

                        if (res.ok) {
                            window.location.reload();
                        } else {
                            alert('Failed to create role');
                        }
                    } catch (err) {
                        console.error(err);
                        alert('Error creating role');
                    }
                });
            }
        });
      `}} />
    </div>
  );
};
