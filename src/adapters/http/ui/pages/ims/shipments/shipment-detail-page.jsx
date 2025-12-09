import { h } from 'preact';

export const ShipmentDetailPage = ({ user, shipment, items, order }) => {
  return (
    <div class="shipment-detail-page">
      <div class="page-header">
        <div>
            <h1>Shipment {shipment.code}</h1>
            <span class="entity-id">ID: {shipment.id}</span>
            <p class="text-muted">For Order <a href={`/ims/orders/${order.id}`}>#{order.id}</a></p>
        </div>
        <span class="badge badge-success">{shipment.status}</span>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <h3>Tracking Number</h3>
          <div class="stat-value text-lg">{shipment.trackingNumber || '-'}</div>
        </div>
        <div class="stat-card">
          <h3>Carrier</h3>
          <div class="stat-value text-lg">{shipment.carrier || '-'}</div>
        </div>
        <div class="stat-card">
          <h3>Shipped Date</h3>
          <div class="stat-value text-lg">{new Date(shipment.shippedAt).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <h3>Total Items</h3>
          <div class="stat-value">{items.reduce((acc, i) => acc + i.quantity, 0)}</div>
        </div>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity Shipped</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr>
                  <td>{item.productName} <span class="text-muted">({item.sku})</span></td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
