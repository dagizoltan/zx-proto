import { h } from 'preact';

export const OrderDetailPage = ({ user, order, layout, title, shipments = [] }) => {
  return (
    <div class="order-detail-page">
      <div class="page-header">
        <div>
            <div class="flex items-center gap-4">
                <h1>Order</h1>
                <span class={`status-badge ${order.status}`}>{order.status}</span>
            </div>
            <span class="entity-id">ID: {order.id}</span>
        </div>
        <div class="flex gap-2">
            <a href={`/ims/orders/${order.id}/pick-list`} target="_blank" class="btn btn-secondary">Pick List</a>
            <a href={`/ims/orders/${order.id}/packing-slip`} target="_blank" class="btn btn-secondary">Packing Slip</a>

            {(order.status === 'CREATED' || order.status === 'PAID' || order.status === 'PARTIALLY_SHIPPED') && (
                <>
                    <a href={`/ims/orders/${order.id}/shipments/new`} class="btn btn-primary">Create Shipment</a>
                    <form method="POST" action={`/ims/orders/${order.id}/status`} style="display:inline;">
                        <input type="hidden" name="status" value="CANCELLED" />
                        <button type="submit" class="btn btn-danger" onclick="return confirm('Are you sure you want to cancel this order?');">
                            Cancel Order
                        </button>
                    </form>
                </>
            )}
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
            <h3>Total Amount</h3>
            <div class="stat-value">${order.total.toFixed(2)}</div>
        </div>
        <div class="stat-card">
            <h3>Items Count</h3>
            <div class="stat-value">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</div>
        </div>
        <div class="stat-card">
            <h3>Date Created</h3>
            <div class="stat-value text-2xl">{new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div class="card p-0 mb-6">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map(item => (
                        <tr>
                            <td>{item.productName || item.productId}</td>
                            <td class="text-right">{item.quantity}</td>
                            <td class="text-right">${item.price?.toFixed(2)}</td>
                            <td class="text-right">${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {shipments.length > 0 && (
          <div class="card p-0">
            <div class="px-6 py-4 border-b border-white/5 bg-white/5">
                <h3 class="m-0 text-white font-semibold">Shipments</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Carrier</th>
                            <th>Tracking</th>
                            <th>Status</th>
                            <th class="text-right">Date</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipments.map(s => (
                            <tr>
                                <td class="font-mono">{s.code}</td>
                                <td>{s.carrier}</td>
                                <td>{s.trackingNumber}</td>
                                <td><span class={`status-badge ${s.status}`}>{s.status}</span></td>
                                <td class="text-right">{new Date(s.shippedAt).toLocaleDateString()}</td>
                                <td class="text-right">
                                    <a href={`/ims/shipments/${s.id}`} class="btn btn-sm btn-secondary">View</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      )}
    </div>
  );
};
