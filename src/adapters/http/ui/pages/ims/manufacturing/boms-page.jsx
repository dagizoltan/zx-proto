import { h } from 'preact';

export const BOMsPage = ({ user, boms }) => {
  return (
    <div class="boms-page">
      <div class="page-header">
        <h1>Bills of Materials</h1>
        <a href="/ims/manufacturing/boms/new" class="btn btn-primary">Create BOM</a>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Product</th>
                <th>Components</th>
                <th>Labor Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {boms.map(bom => (
                <tr>
                  <td class="font-mono text-sm">{bom.id.slice(0, 8)}...</td>
                  <td><a href={`/ims/manufacturing/boms/${bom.id}`}>{bom.name}</a></td>
                  <td>{bom.productName || 'Unknown'}</td>
                  <td>{bom.components.length} items</td>
                  <td>${(bom.laborCost || 0).toFixed(2)}</td>
                  <td>
                    <a href={`/ims/manufacturing/boms/${bom.id}`} class="btn btn-sm btn-secondary">View</a>
                  </td>
                </tr>
              ))}
              {boms.length === 0 && (
                <tr><td colspan="6" class="text-center">No BOMs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
