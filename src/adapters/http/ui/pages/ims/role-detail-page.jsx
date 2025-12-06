import { h } from 'preact';

export const RoleDetailPage = ({ user, role }) => {
  return (
    <div class="role-detail-page">
      <div class="page-header">
        <h1>{role.name}</h1>
        <div class="flex gap-2">
            <a href="/ims/roles" class="btn btn-secondary">Back to List</a>
        </div>
      </div>

      <div class="card mb-4">
        <h3>Details</h3>
        <dl class="grid grid-cols-2 gap-4">
            <div>
                <dt class="text-muted text-sm">ID</dt>
                <dd class="font-mono">{role.id}</dd>
            </div>
            <div>
                <dt class="text-muted text-sm">Name</dt>
                <dd>{role.name}</dd>
            </div>
            <div class="col-span-2">
                <dt class="text-muted text-sm">Permissions</dt>
                <dd>
                    {role.permissions && role.permissions.length > 0 ? (
                        JSON.stringify(role.permissions)
                    ) : (
                        <span class="text-muted">No specific permissions assigned</span>
                    )}
                </dd>
            </div>
        </dl>
      </div>
    </div>
  );
};
