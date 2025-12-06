import { h } from 'preact';

export const TransferStockPage = ({ user, products, locations }) => {
  return (
    <div class="transfer-stock-page">
      <div class="page-header">
        <h1>Transfer Stock</h1>
        <a href="/ims/inventory" class="btn btn-secondary">Cancel</a>
      </div>

      <div class="card">
        <form method="POST" action="/ims/inventory/transfer">
            <div class="form-group mb-4">
                <label>Product</label>
                <select name="productId" required>
                    <option value="">Select Product</option>
                    {products.map(p => <option value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="form-group">
                    <label>From Location</label>
                    <select name="fromLocationId" required>
                        <option value="">Select Origin</option>
                        {locations.map(l => <option value={l.id}>{l.code} ({l.type})</option>)}
                    </select>
                </div>
                <div class="form-group">
                    <label>To Location</label>
                    <select name="toLocationId" required>
                        <option value="">Select Destination</option>
                        {locations.map(l => <option value={l.id}>{l.code} ({l.type})</option>)}
                    </select>
                </div>
            </div>

            <div class="form-group mb-4">
                <label>Quantity</label>
                <input type="number" name="quantity" min="1" required class="form-control" />
            </div>

            <div class="form-group mb-4">
                <label>Reason (Optional)</label>
                <input type="text" name="reason" placeholder="e.g. Replenishment" />
            </div>

            <div class="flex justify-end">
                <button type="submit" class="btn btn-primary">Transfer Stock</button>
            </div>
        </form>
      </div>
    </div>
  );
};
