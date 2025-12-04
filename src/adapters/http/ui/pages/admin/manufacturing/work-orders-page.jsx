import { h } from 'preact';

export const WorkOrdersPage = ({ user, workOrders }) => {
  return (
    <div class="work-orders-page">
      <div class="header-actions">
        <h1>Work Orders</h1>
        <button class="btn-primary" onclick="window.location.href='/admin/work-orders/new'">Create WO</button>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Product (BOM)</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map(wo => (
                <tr>
                  <td>{wo.code}</td>
                  <td><span class={`badge badge-${wo.status.toLowerCase()}`}>{wo.status}</span></td>
                  <td>{wo.productName || 'Unknown'}</td>
                  <td>{wo.quantity}</td>
                  <td>
                    {['PLANNED', 'IN_PROGRESS'].includes(wo.status) && (
                        <form method="POST" action={`/admin/work-orders/${wo.id}/complete`} style="display:inline">
                           <button class="btn-sm btn-primary">Complete</button>
                         </form>
                    )}
                  </td>
                </tr>
              ))}
              {workOrders.length === 0 && (
                <tr><td colspan="5" class="text-center">No work orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
