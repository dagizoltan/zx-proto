import { h } from 'preact';

export const MePage = ({ user }) => {
  return (
    <div class="me-page">
      <div class="page-header">
        <h1>My Profile</h1>
      </div>

      <div class="card">
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="text-muted">Name</label>
                <div class="font-bold text-lg">{user.name || '-'}</div>
            </div>
            <div>
                <label class="text-muted">Email</label>
                <div class="font-bold text-lg">{user.email}</div>
            </div>
            <div>
                <label class="text-muted">User ID</label>
                <div class="font-mono text-sm">{user.id}</div>
            </div>
            <div>
                <label class="text-muted">Tenant ID</label>
                <div class="font-mono text-sm">{user.tenantId}</div>
            </div>
            <div>
                <label class="text-muted">Roles</label>
                <div>
                   {user.roleIds && user.roleIds.length > 0
                     ? user.roleIds.map(rid => <span class="badge badge-neutral mr-2">{rid}</span>)
                     : <span class="text-muted">No roles assigned</span>
                   }
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
