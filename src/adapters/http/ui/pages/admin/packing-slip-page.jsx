import { h } from 'preact';

export const PackingSlipPage = ({ user, order }) => {
  return (
    <div class="packing-slip-page print-layout">
      <div class="header">
        <h1>Packing Slip</h1>
        <div class="meta">
            <p><strong>Order:</strong> #{order.id}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Customer:</strong> {order.userId}</p>
        </div>
      </div>

      <div class="shipping-address mb-8">
        <h3>Ship To:</h3>
        <p>
            {order.shippingAddress?.street}<br/>
            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}<br/>
            {order.shippingAddress?.country}
        </p>
      </div>

      <div class="table-container">
        <table class="table-compact w-full">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr>
                <td>
                    <div class="font-bold">{item.name}</div>
                    <div class="text-sm text-muted">{item.productId}</div>
                </td>
                <td class="text-lg">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div class="footer mt-12 pt-8 border-t border-gray-300 text-center text-sm">
        <p>Thank you for your business!</p>
        <p>For any questions, please contact support.</p>
      </div>

      <style>{`
        .print-layout { max-width: 800px; margin: 0 auto; padding: 2rem; background: white; color: black; font-family: sans-serif; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 2rem; }
        .table-compact th, .table-compact td { padding: 0.75rem; border-bottom: 1px solid #ddd; text-align: left; }
        .w-full { width: 100%; }
        @media print {
            body { background: white; }
            .print-layout { width: 100%; max-width: none; padding: 0; }
            .btn, .sidebar, .navbar { display: none !important; }
        }
      `}</style>

      <div class="actions no-print mt-8">
        <button onclick="window.print()" class="btn btn-primary">Print Packing Slip</button>
        <a href={`/admin/orders/${order.id}`} class="btn btn-secondary ml-4">Back to Order</a>
      </div>
    </div>
  );
};
