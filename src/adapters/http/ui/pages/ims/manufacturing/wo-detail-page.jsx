import { h } from 'preact';

export const WorkOrderDetailPage = ({ user, wo, bom }) => {
  return (
    <div class="wo-detail-page">
      <div class="page-header">
        <h1>{wo.code}</h1>
        <div class="actions">
            <a href="/ims/work-orders" class="btn btn-secondary">Back to List</a>
            {['PLANNED', 'IN_PROGRESS'].includes(wo.status) && (
                <form method="POST" action={`/ims/work-orders/${wo.id}/complete`} style="display:inline">
                    <button class="btn btn-primary">Complete Work Order</button>
                </form>
            )}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6 mb-6">
          <div class="card">
              <h3>Order Details</h3>
              <div class="mb-2">
                  <label class="text-muted">Status</label>
                  <div><span class={`badge badge-${wo.status.toLowerCase()}`}>{wo.status}</span></div>
              </div>
              <div class="mb-2">
                  <label class="text-muted">Start Date</label>
                  <div>{wo.startDate ? new Date(wo.startDate).toLocaleDateString() : '-'}</div>
              </div>
              <div class="mb-2">
                  <label class="text-muted">Completion Date</label>
                  <div>{wo.completionDate ? new Date(wo.completionDate).toLocaleDateString() : '-'}</div>
              </div>
          </div>
          <div class="card">
              <h3>Production</h3>
              <div class="mb-2">
                  <label class="text-muted">Product to Manufacture</label>
                  <div class="font-bold">{wo.productName}</div>
              </div>
              <div class="mb-2">
                  <label class="text-muted">BOM Used</label>
                  <div><a href={`/ims/boms/${wo.bomId}`}>{bom ? bom.name : 'Unknown BOM'}</a></div>
              </div>
              <div class="mb-2">
                  <label class="text-muted">Quantity</label>
                  <div class="text-xl">{wo.quantity}</div>
              </div>
          </div>
      </div>
    </div>
  );
};
