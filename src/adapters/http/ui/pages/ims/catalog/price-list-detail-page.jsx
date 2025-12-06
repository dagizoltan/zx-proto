import { h } from 'preact';

export const PriceListDetailPage = ({ user, priceList }) => {
  return (
    <div class="price-list-detail-page">
      <div class="page-header">
        <h1>{priceList.name}</h1>
        <div class="flex gap-2">
            <a href="/ims/price-lists" class="btn btn-secondary">Back to List</a>
        </div>
      </div>

      <div class="card mb-4">
        <h3>Details</h3>
        <dl class="grid grid-cols-2 gap-4">
            <div>
                <dt class="text-muted text-sm">ID</dt>
                <dd class="font-mono">{priceList.id}</dd>
            </div>
            <div>
                <dt class="text-muted text-sm">Currency</dt>
                <dd>{priceList.currency}</dd>
            </div>
            <div class="col-span-2">
                <dt class="text-muted text-sm">Description</dt>
                <dd>{priceList.description || '-'}</dd>
            </div>
        </dl>
      </div>

      <div class="card p-0">
          <div class="p-4 border-b">
              <h3>Defined Prices</h3>
          </div>
          <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Product ID</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(priceList.prices || {}).map(([pid, price]) => (
                        <tr>
                            <td class="font-mono text-sm">{pid}</td>
                            <td>{price.toFixed(2)}</td>
                        </tr>
                    ))}
                    {Object.keys(priceList.prices || {}).length === 0 && (
                        <tr><td colspan="2" class="text-center text-muted p-4">No specific prices defined.</td></tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};
