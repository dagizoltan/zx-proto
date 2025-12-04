import { h } from 'preact';

export const ReceivePurchaseOrderPage = ({ user, po, locations }) => {
  return (
    <div class="receive-po-page">
      <div class="header-actions">
        <h1>Receive PO: {po.code}</h1>
        <a href="/admin/purchase-orders" class="btn-secondary">Cancel</a>
      </div>

      <div class="card">
        <form method="POST" action={`/admin/purchase-orders/${po.id}/receive`}>

          <div class="form-group">
            <label>Destination Location</label>
            <select name="locationId" required>
              <option value="">Select Location</option>
              {locations.map(l => <option value={l.id}>{l.code} ({l.type})</option>)}
            </select>
            <small>All items will be received into this location.</small>
          </div>

          <h3>Items to Receive</h3>
          <table class="table-simple">
            <thead>
              <tr>
                <th>Product</th>
                <th>Ordered</th>
                <th>Already Received</th>
                <th>Receive Now</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item, index) => (
                <tr>
                  <td>
                    {item.productName || 'Unknown Product'} <br/>
                    <small>{item.sku || ''}</small>
                    <input type="hidden" name={`items[${index}][productId]`} value={item.productId} />
                  </td>
                  <td>{item.quantity}</td>
                  <td>{item.receivedQuantity}</td>
                  <td>
                    <input type="number"
                           name={`items[${index}][quantity]`}
                           value={Math.max(0, item.quantity - item.receivedQuantity)}
                           min="0"
                           max={item.quantity - item.receivedQuantity}
                           class="form-control"
                           style="width: 100px;" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div class="form-actions" style="margin-top: 2rem;">
            <button type="submit" class="btn-primary">Confirm Receipt</button>
          </div>
        </form>
      </div>
    </div>
  );
};
