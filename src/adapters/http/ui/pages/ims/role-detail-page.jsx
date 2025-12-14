import { h } from 'preact';

export const RoleDetailPage = ({ user, role, users = [] }) => {
  return (
    <div class="role-detail-page space-y-6">
      <div class="page-header flex justify-between items-center border-b pb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">{role.name}</h1>
          <span class="text-sm text-gray-500 font-mono">ID: {role.id}</span>
        </div>
        <div class="flex gap-2">
          <a href="/ims/access-control/roles" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-1"></i> Back to List
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Role Information Card */}
        <div class="card bg-white p-6 rounded shadow col-span-1 md:col-span-2">
          <h3 class="text-lg font-semibold mb-4 border-b pb-2">Role Information</h3>
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt class="text-xs font-uppercase text-gray-500 tracking-wide">Role Name</dt>
              <dd class="font-medium text-gray-900">{role.name}</dd>
            </div>
            <div>
              <dt class="text-xs font-uppercase text-gray-500 tracking-wide">Role ID</dt>
              <dd class="font-mono text-sm text-gray-600 bg-gray-100 p-1 rounded inline-block">
                {role.id}
              </dd>
            </div>
            <div class="col-span-1 md:col-span-2">
              <dt class="text-xs font-uppercase text-gray-500 tracking-wide mb-2">Permissions</dt>
              <dd>
                {role.permissions && role.permissions.length > 0 ? (
                  <div class="flex flex-wrap gap-2">
                    {role.permissions.map((perm, idx) => (
                      <span key={idx} class="badge badge-info px-2 py-1 rounded text-xs">
                        {perm}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span class="text-gray-400 italic">No specific permissions assigned</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Stats / Quick Info Side Panel (Optional placeholder) */}
        <div class="card bg-gray-50 p-6 rounded border border-gray-200 col-span-1">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
          <div class="flex flex-col gap-3">
             <div class="flex justify-between items-center">
                <span class="text-gray-600 text-sm">Users Assigned</span>
                <span class="font-bold text-xl">{users.length}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Users List Section */}
      <div class="card bg-white rounded shadow overflow-hidden">
        <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
             <h3 class="text-lg font-semibold text-gray-800">Assigned Users</h3>
             <span class="text-xs text-gray-500">{users.length} user{users.length !== 1 && 's'}</span>
        </div>
        <div class="overflow-x-auto">
            {users.length > 0 ? (
                <table class="w-full text-left text-sm text-gray-600">
                    <thead class="bg-gray-100 text-gray-700 uppercase font-medium text-xs">
                        <tr>
                            <th class="px-6 py-3">User Name</th>
                            <th class="px-6 py-3">Email</th>
                            <th class="px-6 py-3">ID</th>
                            <th class="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        {users.map(u => (
                            <tr key={u.id} class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 font-medium text-gray-900">
                                    <a href={`/ims/access-control/users/${u.id}`} class="hover:text-primary hover:underline">
                                        {u.name}
                                    </a>
                                </td>
                                <td class="px-6 py-4">{u.email}</td>
                                <td class="px-6 py-4 font-mono text-xs">{u.id}</td>
                                <td class="px-6 py-4 text-right">
                                    <a href={`/ims/access-control/users/${u.id}`} class="text-primary hover:text-primary-focus">
                                        <i class="bi bi-eye"></i> View
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div class="p-8 text-center text-gray-500 italic">
                    No users assigned to this role.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
