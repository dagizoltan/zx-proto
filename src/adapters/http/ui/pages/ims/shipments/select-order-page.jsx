import { h } from 'preact';

export const SelectOrderPage = ({ user, orders }) => {
  return (
    <div class="select-order-page">
      <div class="page-header">
        <h1>Select Order to Ship</h1>
        <a href="/ims/shipments" class="btn btn-secondary">Cancel</a>
      </div>

      <div class="card p-0">
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr>
                            <td class="font-mono">{order.id.slice(0, 8)}...</td>
                            <td>{order.customerName || order.userId}</td>
                            <td><span class={`badge status-badge ${order.status}`}>{order.status}</span></td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                                <a href={`/ims/orders/${order.id}/shipments/new`} class="btn btn-sm btn-primary">Create Shipment</a>
                            </td>
                        </tr>
                    ))}
                    {orders.length === 0 && (
                        <tr><td colspan="5" class="text-center py-4 text-muted">No shippable orders found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
