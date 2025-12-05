import { h } from 'preact';

export const PackingSlipPage = ({ user, order }) => {
  return (
    <div class="packing-slip-page">
      <div class="page-header">
        <div class="flex items-center gap-4">
            <h1>Packing Slip #{order.id}</h1>
            <span class="badge badge-neutral text-base font-normal">Date: {new Date().toLocaleDateString()}</span>
        </div>
        <div class="flex gap-2 no-print">
            <button onclick="window.print()" class="btn btn-primary">Print Packing Slip</button>
            <a href={`/admin/orders/${order.id}`} class="btn btn-secondary">Back to Order</a>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6 mb-6">
        <div class="card">
            <h3>Order Details</h3>
            <div class="mb-2">
                <label class="text-muted">Order Number</label>
                <div class="font-bold">#{order.id}</div>
            </div>
            <div class="mb-2">
                <label class="text-muted">Customer ID</label>
                <div>{order.userId}</div>
            </div>
        </div>
        <div class="card">
            <h3>Ship To</h3>
            <address class="not-italic">
                {order.shippingAddress ? (
                    <>
                        {order.shippingAddress.name && <div>{order.shippingAddress.name}</div>}
                        {order.shippingAddress.street && <div>{order.shippingAddress.street}</div>}
                        <div>
                            {order.shippingAddress.city && <span>{order.shippingAddress.city}, </span>}
                            {order.shippingAddress.state && <span>{order.shippingAddress.state} </span>}
                            {order.shippingAddress.zip && <span>{order.shippingAddress.zip}</span>}
                        </div>
                        {order.shippingAddress.country && <div>{order.shippingAddress.country}</div>}
                    </>
                ) : (
                    <span class="text-muted">No shipping address provided</span>
                )}
            </address>
        </div>
      </div>

      <div class="card p-0 mb-6">
        <div class="table-container">
            <table>
            <thead>
                <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity</th>
                </tr>
            </thead>
            <tbody>
                {order.items.map(item => (
                <tr>
                    <td>
                        <div class="font-bold">{item.name || item.productName}</div>
                    </td>
                    <td class="text-muted text-sm">{item.sku || item.productId}</td>
                    <td class="text-lg">{item.quantity}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      <div class="text-center text-muted text-sm mt-8 pb-8">
        <p>Thank you for your business!</p>
        <p>For any questions, please contact support.</p>
      </div>

      <style>{`
        @media print {
            .admin-sidebar, .admin-header, .no-print { display: none !important; }
            .admin-content { padding: 0 !important; margin: 0 !important; overflow: visible !important; }
            .card { box-shadow: none !important; border: 1px solid #ddd !important; margin-bottom: 1rem !important; }
            /* Remove grid gap for print if needed, or keep it */
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            body { background-color: white !important; }
            .packing-slip-page { width: 100%; }
        }
      `}</style>
    </div>
  );
};
