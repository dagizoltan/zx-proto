import { h } from 'preact';

export const UserDetailPage = ({ user, userData, roles }) => {
  return (
    <div class="user-detail-page">
      <div class="page-header">
        <h1>{userData.name}</h1>
        <div class="flex gap-2">
            <a href="/ims/users" class="btn btn-secondary">Back to List</a>
        </div>
      </div>

      <div class="card mb-4">
        <h3>User Profile</h3>
        <dl class="grid grid-cols-2 gap-4">
            <div>
                <dt class="text-muted text-sm">ID</dt>
                <dd class="font-mono">{userData.id}</dd>
            </div>
            <div>
                <dt class="text-muted text-sm">Email</dt>
                <dd>{userData.email}</dd>
            </div>
            <div class="col-span-2">
                <dt class="text-muted text-sm">Assigned Roles</dt>
                <dd>
                    {userData.roleIds && userData.roleIds.length > 0 ? (
                        userData.roleIds.map(rid => {
                            const r = roles.find(role => role.id === rid);
                            return <span key={rid} class="badge badge-primary" style="margin-right: 0.25rem;">{r ? r.name : rid}</span>
                        })
                    ) : <span class="text-muted">No roles assigned</span>}
                </dd>
            </div>
        </dl>
      </div>
    </div>
  );
};
