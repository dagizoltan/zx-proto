import { h } from 'preact';

export const CustomersPage = ({ customers = [] }) => {
  return (
    <div>
      <div class="page-header">
        <h1>Customers</h1>
        <a href="/ims/customers/new" class="btn btn-primary">New Customer</a>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
            <h3>Total Customers</h3>
             {/* If pagination is used, this is just page count, but better than nothing */}
            <div class="stat-value">{customers.length}</div>
        </div>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map(c => (
                        <tr key={c.id}>
                            <td class="font-mono text-sm">{c.id.slice(0, 8)}...</td>
                            <td class="font-medium">{c.name}</td>
                            <td class="text-muted">{c.email}</td>
                            <td class="text-muted text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                            <td>
                                <a href={`/ims/customers/${c.id}`} class="btn btn-sm btn-secondary">View Profile</a>
                            </td>
                        </tr>
                    ))}
                    {customers.length === 0 && <tr><td colspan="5" class="text-center text-muted">No customers found</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
