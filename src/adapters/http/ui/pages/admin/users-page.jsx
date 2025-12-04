import { h } from 'preact';
import { useState } from 'preact/hooks';
import { LayoutWrapper } from './layout-wrapper.jsx';

export const UsersPage = (props) => {
  // SSR Data
  const initialUsers = props.users || [];
  const initialRoles = props.roles || [];

  const [users, setUsers] = useState(initialUsers);
  const [roles] = useState(initialRoles);

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  const openAssignModal = (user) => {
      setSelectedUser(user);
      setSelectedRoleIds(user.roleIds || []);
      const dialog = document.getElementById('assign-role-dialog');
      if(dialog) dialog.showModal();
  };

  const closeAssignModal = () => {
      const dialog = document.getElementById('assign-role-dialog');
      if(dialog) dialog.close();
      setSelectedUser(null);
  };

  const handleAssignSubmit = async (e) => {
      e.preventDefault();
      try {
          await fetch(`/api/admin/users/${selectedUser.id}/roles`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roleIds: selectedRoleIds })
          });

          // Optimistic update
          setUsers(users.map(u =>
              u.id === selectedUser.id ? { ...u, roleIds: selectedRoleIds } : u
          ));

          closeAssignModal();
      } catch (e) {
          alert('Failed to update roles');
      }
  };

  const toggleRoleSelection = (roleId) => {
      if (selectedRoleIds.includes(roleId)) {
          setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId));
      } else {
          setSelectedRoleIds([...selectedRoleIds, roleId]);
      }
  };

  return (
    <LayoutWrapper activePage="users">
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6">Users & Roles</h1>

        <div class="bg-white shadow rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                        <tr key={user.id}>
                            <td class="px-6 py-4 whitespace-nowrap">{user.name}</td>
                            <td class="px-6 py-4 whitespace-nowrap">{user.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                {user.roleIds && user.roleIds.length > 0 ? (
                                    user.roleIds.map(rid => {
                                        const r = roles.find(role => role.id === rid);
                                        return <span key={rid} class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">{r ? r.name : rid}</span>
                                    })
                                ) : <span class="text-gray-400 text-sm">No roles</span>}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => openAssignModal(user)} class="text-indigo-600 hover:text-indigo-900">Edit Roles</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <dialog id="assign-role-dialog" class="p-0 rounded-lg shadow-xl backdrop:bg-gray-500/50">
            {selectedUser && (
                <form onSubmit={handleAssignSubmit} class="w-96">
                    <div class="px-6 py-4 border-b">
                        <h3 class="text-lg font-medium">Assign Roles to {selectedUser.name}</h3>
                    </div>
                    <div class="px-6 py-4 space-y-2">
                        {roles.map(role => (
                            <div key={role.id} class="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`role-${role.id}`}
                                    checked={selectedRoleIds.includes(role.id)}
                                    onChange={() => toggleRoleSelection(role.id)}
                                    class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label for={`role-${role.id}`} class="ml-2 block text-sm text-gray-900">
                                    {role.name}
                                </label>
                            </div>
                        ))}
                    </div>
                    <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-2 rounded-b-lg">
                        <button type="button" onClick={closeAssignModal} class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
                        <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Save</button>
                    </div>
                </form>
            )}
        </dialog>
      </div>
    </LayoutWrapper>
  );
};
