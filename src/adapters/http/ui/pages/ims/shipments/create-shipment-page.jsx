import { h } from 'preact';

export const CreateShipmentPage = ({ user, order, orderItems, activePage }) => {
  return (
    <div class="create-shipment-page">
      <div class="page-header">
        <h1>Create Shipment for Order #{order.id}</h1>
        <a href={`/ims/orders/${order.id}`} class="btn btn-secondary">Back to Order</a>
      </div>

      <div class="card">
        <form method="POST" action={`/ims/orders/${order.id}/shipments`}>
          <div class="form-group">
            <label for="trackingNumber">Tracking Number</label>
            <input type="text" id="trackingNumber" name="trackingNumber" placeholder="e.g. 1Z999..." required />
          </div>
          <div class="form-group">
            <label for="carrier">Carrier</label>
            <input type="text" id="carrier" name="carrier" placeholder="e.g. UPS, FedEx" required />
          </div>

          <h3>Items to Ship</h3>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Ordered</th>
                  <th>Ship Quantity</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, index) => (
                  <tr>
                    <td>{item.productName} ({item.sku})</td>
                    <td>{item.quantity}</td>
                    <td>
                        <input
                            type="hidden"
                            name={`items[${index}][productId]`}
                            value={item.productId}
                        />
                        <input
                            type="number"
                            name={`items[${index}][quantity]`}
                            min="0"
                            max={item.quantity}
                            value={item.quantity}
                            class="w-20 px-2 py-1 border rounded"
                        />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div class="mt-6 flex justify-end">
            <button type="submit" class="btn btn-primary">Create Shipment</button>
          </div>
        </form>
      </div>
    </div>
  );
};
