import { h } from 'preact';

export const OrderDetailPage = ({ user, order, layout, title, shipments = [] }) => {
  return (
    <div class="order-detail-page">
      <div class="page-header">
        <div>
            <div class="flex items-center gap-4">
                <h1>Order</h1>
                <span class={`badge status-badge ${order.status}`}>{order.status}</span>
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
            <div class="stat-value text-xl">{new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div class="card p-0 mb-6">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map(item => (
                        <tr>
                            <td>{item.productName || item.productId}</td>
                            <td>{item.quantity}</td>
                            <td>${item.price?.toFixed(2)}</td>
                            <td>${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {shipments.length > 0 && (
          <div class="card p-0">
            <div class="card-header px-6 py-4 border-b border-border">
                <h3 class="m-0">Shipments</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Carrier</th>
                            <th>Tracking</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipments.map(s => (
                            <tr>
                                <td>{s.code}</td>
                                <td>{s.carrier}</td>
                                <td>{s.trackingNumber}</td>
                                <td><span class="badge badge-success">{s.status}</span></td>
                                <td>{new Date(s.shippedAt).toLocaleDateString()}</td>
                                <td>
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
