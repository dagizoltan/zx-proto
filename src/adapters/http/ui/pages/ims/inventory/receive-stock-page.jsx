import { h } from 'preact';

export const ReceiveStockPage = ({ user, products, locations }) => {
  return (
    <div class="receive-stock-page">
      <div class="page-header">
        <h1>Receive Stock</h1>
        <a href="/ims/inventory" class="btn btn-secondary">Cancel</a>
      </div>

      <div class="card">
        <form method="POST" action="/ims/inventory/receive">
            <div class="form-group mb-4">
                <label>Product</label>
                <select name="productId" required>
                    <option value="">Select Product</option>
                    {products.map(p => <option value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
            </div>

            <div class="form-group mb-4">
                <label>Location</label>
                <select name="locationId" required>
                    <option value="">Select Location</option>
                    {locations.map(l => <option value={l.id}>{l.code} ({l.type})</option>)}
                </select>
            </div>

            <div class="form-group mb-4">
                <label>Quantity</label>
                <input type="number" name="quantity" min="1" required class="form-control" />
            </div>

             <div class="form-group mb-4">
                <label>Batch Number (Optional)</label>
                <input type="text" name="batchNumber" placeholder="e.g. BATCH-001" />
            </div>

            <div class="form-group mb-4">
                <label>Expiry Date (Optional)</label>
                <input type="date" name="expiryDate" />
            </div>

            <div class="flex justify-end">
                <button type="submit" class="btn btn-primary">Receive Stock</button>
            </div>
        </form>
      </div>
    </div>
  );
};
