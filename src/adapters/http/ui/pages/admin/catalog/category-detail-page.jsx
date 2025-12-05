import { h } from 'preact';

export const CategoryDetailPage = ({ user, category, subCategories = [] }) => {
  return (
    <div class="category-detail-page">
      <div class="page-header">
        <h1>{category.name}</h1>
        <div class="flex gap-2">
            <a href="/admin/categories" class="btn btn-secondary">Back to List</a>
        </div>
      </div>

      <div class="card mb-4">
        <h3>Details</h3>
        <dl class="grid grid-cols-2 gap-4">
            <div>
                <dt class="text-muted text-sm">ID</dt>
                <dd class="font-mono">{category.id}</dd>
            </div>
            <div>
                <dt class="text-muted text-sm">Parent ID</dt>
                <dd>{category.parentId || 'Root'}</dd>
            </div>
            <div class="col-span-2">
                <dt class="text-muted text-sm">Description</dt>
                <dd>{category.description || '-'}</dd>
            </div>
        </dl>
      </div>

      <div class="card p-0">
          <div class="p-4 border-b">
              <h3>Sub-Categories</h3>
          </div>
          <div class="table-container">
              <table>
                  <thead>
                      <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Created At</th>
                          <th>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {subCategories.map(sub => (
                          <tr>
                              <td class="font-mono text-sm">{sub.id.slice(0,8)}...</td>
                              <td>{sub.name}</td>
                              <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                              <td>
                                  <a href={`/admin/categories/${sub.id}`} class="btn btn-sm btn-secondary">View</a>
                              </td>
                          </tr>
                      ))}
                      {subCategories.length === 0 && (
                          <tr><td colspan="4" class="text-center text-muted p-4">No sub-categories.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};
