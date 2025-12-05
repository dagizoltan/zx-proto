import { h } from 'preact';

export const UsersPage = (props) => {
  // SSR Data
  const users = props.users || [];
  const roles = props.roles || [];

  return (
    <div>
      <div class="page-header">
        <h1>Users</h1>
        {/* Users usually created via auth, no create button needed unless Invitation system */}
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Roles</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td class="font-mono text-sm">{user.id.slice(0, 8)}...</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                {user.roleIds && user.roleIds.length > 0 ? (
                                    user.roleIds.map(rid => {
                                        const r = roles.find(role => role.id === rid);
                                        return <span key={rid} class="badge badge-primary" style="margin-right: 0.25rem;">{r ? r.name : rid}</span>
                                    })
                                ) : <span class="text-muted">No roles</span>}
                            </td>
                            <td>
                                <a href={`/admin/users/${user.id}`} class="btn btn-sm btn-secondary" style="margin-right: 0.25rem;">View</a>
                                <button
                                  class="btn btn-sm btn-secondary open-role-modal"
                                  data-user-id={user.id}
                                  data-user-name={user.name}
                                  data-user-roles={JSON.stringify(user.roleIds || [])}
                                >
                                  Edit Roles
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <dialog id="assign-role-dialog">
          <form id="assign-role-form">
              <input type="hidden" id="modal-user-id" name="userId" />
              <div class="modal-header">
                  <h3>Assign Roles to <span id="modal-user-name"></span></h3>
              </div>
              <div class="modal-body">
                  {roles.map(role => (
                      <div key={role.id} class="flex items-center mb-4">
                          <input
                              type="checkbox"
                              name="roleIds"
                              value={role.id}
                              id={`role-${role.id}`}
                          />
                          <label for={`role-${role.id}`} class="ml-2">
                              {role.name}
                          </label>
                      </div>
                  ))}
              </div>
              <div class="modal-footer">
                  <button type="button" id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
                  <button type="submit" class="btn btn-primary">Save</button>
              </div>
          </form>
      </dialog>

      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', () => {
            const dialog = document.getElementById('assign-role-dialog');
            const form = document.getElementById('assign-role-form');
            const cancelBtn = document.getElementById('modal-cancel-btn');
            const userNameSpan = document.getElementById('modal-user-name');
            const userIdInput = document.getElementById('modal-user-id');

            // Open Modal
            if (dialog) {
                document.querySelectorAll('.open-role-modal').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const userId = btn.getAttribute('data-user-id');
                        const userName = btn.getAttribute('data-user-name');
                        const userRoles = JSON.parse(btn.getAttribute('data-user-roles'));

                        userIdInput.value = userId;
                        userNameSpan.textContent = userName;

                        // Reset checkboxes
                        form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            cb.checked = userRoles.includes(cb.value);
                        });

                        dialog.showModal();
                    });
                });

                // Close Modal
                cancelBtn.addEventListener('click', () => {
                    dialog.close();
                });

                // Handle Submit
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const userId = userIdInput.value;
                    const selectedRoles = Array.from(form.querySelectorAll('input[name="roleIds"]:checked')).map(cb => cb.value);

                    try {
                        const res = await fetch(\`/api/admin/users/\${userId}/roles\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ roleIds: selectedRoles })
                        });

                        if (res.ok) {
                            window.location.reload(); // Simple reload to refresh data
                        } else {
                            alert('Failed to update roles');
                        }
                    } catch (err) {
                        console.error(err);
                        alert('Error updating roles');
                    }
                });
            }
        });
      `}} />
    </div>
  );
};
