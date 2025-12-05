import { h } from 'preact';

export const LocationDetailPage = ({ user, location, warehouse, parentLocation }) => {
  return (
    <div class="location-detail-page">
      <div class="page-header">
        <h1>{location.code}</h1>
        <div class="flex gap-2">
            <a href="/admin/locations" class="btn btn-secondary">Back to List</a>
        </div>
      </div>

      <div class="card mb-4">
        <h3>Details</h3>
        <dl class="grid grid-cols-2 gap-4">
            <div>
                <dt class="text-muted text-sm">ID</dt>
                <dd class="font-mono">{location.id}</dd>
            </div>
            <div>
                <dt class="text-muted text-sm">Type</dt>
                <dd>{location.type}</dd>
            </div>
            <div>
                <dt class="text-muted text-sm">Warehouse</dt>
                <dd>{warehouse ? warehouse.name : location.warehouseId}</dd>
            </div>
            <div>
                <dt class="text-muted text-sm">Parent</dt>
                <dd>{parentLocation ? parentLocation.code : '-'}</dd>
            </div>
        </dl>
      </div>
    </div>
  );
};
