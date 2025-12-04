import { h } from 'preact';

export const BOMsPage = ({ user, boms }) => {
  return (
    <div class="boms-page">
      <div class="header-actions">
        <h1>Bills of Materials</h1>
        <button class="btn-primary" onclick="window.location.href='/admin/boms/new'">Create BOM</button>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Product</th>
                <th>Components</th>
                <th>Labor Cost</th>
              </tr>
            </thead>
            <tbody>
              {boms.map(bom => (
                <tr>
                  <td><a href={`/admin/boms/${bom.id}`}>{bom.name}</a></td>
                  <td>{bom.productName || 'Unknown'}</td>
                  <td>{bom.components.length} items</td>
                  <td>${(bom.laborCost || 0).toFixed(2)}</td>
                </tr>
              ))}
              {boms.length === 0 && (
                <tr><td colspan="4" class="text-center">No BOMs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
