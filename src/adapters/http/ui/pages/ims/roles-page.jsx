import { h } from 'preact';

export const RolesPage = (props) => {
  const roles = props.roles || [];

  return (
    <div>
      <div class="page-header">
        <h1>Roles</h1>
        <a href="/ims/access-control/roles/new" class="btn btn-primary">Create Role</a>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Role Name</th>
                        <th>Permissions</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {roles.map(role => (
                        <tr key={role.id}>
                            <td class="font-mono text-sm">{role.id.slice(0, 8)}...</td>
                            <td class="font-medium">{role.name}</td>
                            <td class="text-muted">
                                {role.permissions && role.permissions.length > 0 ? JSON.stringify(role.permissions) : 'No specific permissions'}
                            </td>
                            <td>
                                <a href={`/ims/access-control/roles/${role.id}`} class="btn btn-sm btn-secondary">View</a>
                            </td>
                        </tr>
                    ))}
                    {roles.length === 0 && (
                        <tr><td colspan="4" class="text-center text-muted">No roles found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
