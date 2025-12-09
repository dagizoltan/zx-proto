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
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map(wo => (
                <tr>
                  <td class="font-mono text-sm">{wo.id.slice(0, 8)}...</td>
                  <td><a href={`/ims/manufacturing/work-orders/${wo.id}`}>{wo.code}</a></td>
                  <td><span class={`badge badge-${wo.status.toLowerCase()}`}>{wo.status}</span></td>
                  <td>{wo.productName || 'Unknown'}</td>
                  <td>{wo.quantity}</td>
                  <td>
                    <a href={`/ims/manufacturing/work-orders/${wo.id}`} class="btn btn-sm btn-secondary" style="margin-right: 0.25rem;">View</a>
                    {['PLANNED', 'IN_PROGRESS'].includes(wo.status) && (
                        <form method="POST" action={`/ims/manufacturing/work-orders/${wo.id}/complete`} style="display:inline">
                           <button class="btn btn-sm btn-primary">Complete</button>
                         </form>
                    )}
                  </td>
                </tr>
              ))}
              {workOrders.length === 0 && (
                <tr><td colspan="6" class="text-center">No work orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
