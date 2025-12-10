import { h } from 'preact';

export const WorkOrdersPage = ({ user, workOrders }) => {
  return (
    <div class="work-orders-page">
      <div class="page-header">
        <h1>Work Orders</h1>
        <a href="/ims/manufacturing/work-orders/new" class="btn btn-primary">Create WO</a>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
            <h3>Active</h3>
            <div class="stat-value">{workOrders.filter(wo => ['PLANNED', 'IN_PROGRESS'].includes(wo.status)).length}</div>
        </div>
        <div class="stat-card">
            <h3>Completed</h3>
            <div class="stat-value">{workOrders.filter(wo => wo.status === 'COMPLETED').length}</div>
        </div>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Status</th>
                <th>Product (BOM)</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map(wo => (
                <tr>
                  <td class="font-mono text-sm">
                      <a href={`/ims/manufacturing/work-orders/${wo.id}`}>{wo.id.slice(0, 8)}...</a>
                  </td>
                  <td>{wo.code}</td>
                  <td><span class={`status-badge ${wo.status}`}>{wo.status}</span></td>
                  <td>{wo.productName || 'Unknown'}</td>
                  <td class="text-right">{wo.quantity}</td>
                  <td class="text-right flex justify-end gap-2">
                    <a href={`/ims/manufacturing/work-orders/${wo.id}`} class="btn btn-sm btn-secondary">View</a>
                    {/* Note: Complete button usually requires navigation to completion page or modal, but if POST is supported directly: */}
                    {['PLANNED', 'IN_PROGRESS'].includes(wo.status) && (
                         <a href={`/ims/manufacturing/work-orders/${wo.id}/complete`} class="btn btn-sm btn-primary">Complete</a>
                    )}
                  </td>
                </tr>
              ))}
              {workOrders.length === 0 && (
                <tr><td colspan="6" class="text-center text-muted">No work orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
