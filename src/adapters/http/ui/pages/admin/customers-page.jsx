import { h } from 'preact';

export const CustomersPage = ({ customers = [] }) => {
  return (
    <div>
      <div class="page-header">
        <h1>Customers</h1>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th class="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map(c => (
                        <tr key={c.id}>
                            <td class="font-medium">{c.name}</td>
                            <td class="text-muted">{c.email}</td>
                            <td class="text-muted text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                            <td class="text-right">
                                <a href={`/admin/customers/${c.id}`} class="btn btn-sm btn-secondary">View Profile</a>
                            </td>
                        </tr>
                    ))}
                    {customers.length === 0 && <tr><td colspan="4" class="text-center text-muted">No customers found</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
