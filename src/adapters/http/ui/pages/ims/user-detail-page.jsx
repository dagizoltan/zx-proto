import { h } from 'preact';

export const UserDetailPage = ({ user, userData, roles }) => {
  return (
    <div class="user-detail-page space-y-6">
      <div class="page-header flex justify-between items-center border-b pb-4">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">{userData.name}</h1>
            <span class="text-sm text-gray-500 font-mono">ID: {userData.id}</span>
        </div>
        <div class="flex gap-2">
            <a href="/ims/access-control/users" class="btn btn-secondary">
                <i class="bi bi-arrow-left me-1"></i> Back to List
            </a>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card bg-white p-6 rounded shadow col-span-1 md:col-span-2">
            <h3 class="text-lg font-semibold mb-4 border-b pb-2">User Profile</h3>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <dt class="text-xs font-uppercase text-gray-500 tracking-wide">Full Name</dt>
                    <dd class="font-medium text-gray-900">{userData.name}</dd>
                </div>
                <div>
                    <dt class="text-xs font-uppercase text-gray-500 tracking-wide">Email Address</dt>
                    <dd class="text-gray-900">
                        <a href={`mailto:${userData.email}`} class="hover:text-primary hover:underline flex items-center gap-1">
                             <i class="bi bi-envelope text-gray-400"></i> {userData.email}
                        </a>
                    </dd>
                </div>
                <div>
                    <dt class="text-xs font-uppercase text-gray-500 tracking-wide">User ID</dt>
                    <dd class="font-mono text-sm text-gray-600 bg-gray-100 p-1 rounded inline-block">
                        {userData.id}
                    </dd>
                </div>
            </dl>

            <div class="mt-6 pt-4 border-t border-gray-100">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">Assigned Roles</h4>
                <div class="flex flex-wrap gap-2">
                    {userData.roleIds && userData.roleIds.length > 0 ? (
                        userData.roleIds.map(rid => {
                            const r = roles.find(role => role.id === rid);
                            return (
                                <a
                                    key={rid}
                                    href={`/ims/access-control/roles/${rid}`}
                                    class="badge badge-primary px-3 py-1.5 rounded-full text-sm no-underline hover:opacity-90 transition-opacity flex items-center gap-1"
                                >
                                    <i class="bi bi-shield-lock-fill text-xs opacity-70"></i>
                                    {r ? r.name : rid}
                                </a>
                            );
                        })
                    ) : (
                        <span class="text-gray-400 italic text-sm">No roles assigned</span>
                    )}
                </div>
            </div>
        </div>

        {/* Placeholder for future activity log or related info */}
        <div class="card bg-gray-50 p-6 rounded border border-gray-200 col-span-1 flex flex-col justify-center items-center text-center">
             <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <i class="bi bi-person text-3xl text-gray-400"></i>
             </div>
             <h3 class="text-md font-medium text-gray-700">User Account</h3>
             <p class="text-xs text-gray-500 mt-1">Managed by IMS Admin</p>
        </div>
      </div>
    </div>
  );
};
