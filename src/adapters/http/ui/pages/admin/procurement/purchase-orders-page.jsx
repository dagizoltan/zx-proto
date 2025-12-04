export const PurchaseOrdersPage = ({ user, purchaseOrders, activePage, layout, title }) => {
  return layout({
    user,
    activePage,
    title,
    content: `
      <div class="header-actions">
        <h1>Purchase Orders</h1>
        <button class="btn-primary" onclick="document.getElementById('create-po-modal').showModal()">Create PO</button>
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
                  <td><a href="/admin/purchase-orders/${po.id}">${po.code}</a></td>
                  <td><span class="badge badge-${po.status.toLowerCase()}">${po.status}</span></td>
                  <td>${po.supplierName || 'Unknown'}</td> <!-- Enriched in controller -->
                  <td>$${po.totalCost.toFixed(2)}</td>
                  <td>${po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}</td>
                  <td>
                    ${po.status === 'DRAFT' || po.status === 'ISSUED' ?
                        `<a href="/admin/purchase-orders/${po.id}/receive" class="btn-sm">Receive</a>` : ''}
                  </td>
                </tr>
              `).join('')}
              ${purchaseOrders.length === 0 ? '<tr><td colspan="6" class="text-center">No purchase orders found</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Simple PO Create Modal -->
      <dialog id="create-po-modal" class="modal">
         <div class="modal-body">
             <p>To create a PO, please go to the <a href="/admin/purchase-orders/new">New Purchase Order Page</a>.</p>
         </div>
         <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="this.closest('dialog').close()">Close</button>
         </div>
      </dialog>
    `
  });
};
