import { h } from 'preact';
import { LayoutWrapper } from './layout-wrapper.jsx';

export const CustomersPage = ({ customers = [] }) => {
  return (
    <LayoutWrapper activePage="customers">
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6">Customers</h1>

        <div class="bg-white shadow rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {customers.map(c => (
                        <tr key={c.id} class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap font-medium">{c.name}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-gray-500">{c.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <a href={`/admin/customers/${c.id}`} class="text-indigo-600 hover:text-indigo-900">View Profile</a>
                            </td>
                        </tr>
                    ))}
                    {customers.length === 0 && <tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No customers found</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </LayoutWrapper>
  );
};
