import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { LayoutWrapper } from './layout-wrapper.jsx';

export const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Role Form
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const res = await fetch('/api/admin/roles');
        const data = await res.json();
        setRoles(data || []);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
      e.preventDefault();
      try {
          await fetch('/api/admin/roles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newRoleName, permissions: [] }) // Empty perms for now
          });
          setNewRoleName('');
          fetchData();
      } catch (e) {
          alert('Failed to create role');
      }
  };

  return (
    <LayoutWrapper activePage="roles">
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6">Roles Management</h1>

        {/* Create Role */}
        <div class="mb-8 bg-white p-4 rounded-lg shadow">
            <h2 class="text-lg font-medium mb-4">Create New Role</h2>
            <form onSubmit={handleCreateRole} class="flex gap-4">
                <input
                    type="text"
                    value={newRoleName}
                    onInput={(e) => setNewRoleName(e.target.value)}
                    placeholder="Role Name (e.g. Warehouse Manager)"
                    class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    required
                />
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Create Role</button>
            </form>
        </div>

        {/* List Roles */}
        <div class="bg-white shadow rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {roles.map(role => (
                        <tr key={role.id}>
                            <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{role.name}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                {role.permissions && role.permissions.length > 0 ? JSON.stringify(role.permissions) : 'No specific permissions'}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-gray-400 text-xs">{role.id}</td>
                        </tr>
                    ))}
                    {roles.length === 0 && !loading && (
                        <tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No roles found</td></tr>
                    )}
                </tbody>
            </table>
        </div>

      </div>
    </LayoutWrapper>
  );
};
