export const PurchaseOrdersPage = ({ user, purchaseOrders, activePage, title }) => {
  return `
      <div class="header-actions">
        <h1>Purchase Orders</h1>
        <button class="btn-primary" onclick="window.location.href='/admin/purchase-orders/new'">Create PO</button>
      </div>

      <div class="card">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Supplier</th>
                <th>Total Cost</th>
                <th>Expected Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${purchaseOrders.map(po => `
                <tr>
                  <td><a href="/admin/purchase-orders/${po.id}/receive">${po.code}</a></td>
                  <td><span class="badge badge-${po.status.toLowerCase()}">${po.status}</span></td>
                  <td>${po.supplierName || 'Unknown'}</td>
                  <td>$${po.totalCost.toFixed(2)}</td>
                  <td>${po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}</td>
                  <td>
                    ${po.status === 'DRAFT' || po.status === 'ISSUED' || po.status === 'PARTIAL' ?
                        `<a href="/admin/purchase-orders/${po.id}/receive" class="btn-sm">Receive</a>` : ''}
                  </td>
                </tr>
              `).join('')}
              ${purchaseOrders.length === 0 ? '<tr><td colspan="6" class="text-center">No purchase orders found</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
  `;
};
