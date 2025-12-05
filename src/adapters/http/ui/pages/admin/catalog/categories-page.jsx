import { h } from 'preact';

export const CategoriesPage = ({ user, categories = [], nextCursor }) => {
  return (
    <div class="categories-page">
      <div class="page-header">
        <h1>Categories</h1>
        <a href="/admin/catalog/categories/new" class="btn btn-primary">Add Category</a>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Parent ID</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map(cat => (
                  <tr>
                    <td class="font-mono text-sm">{cat.id.slice(0, 8)}...</td>
                    <td>{cat.name}</td>
                    <td>{cat.description || '-'}</td>
                    <td><span class="badge badge-neutral">{cat.parentId || 'Root'}</span></td>
                    <td>{new Date(cat.createdAt).toLocaleDateString()}</td>
                    <td>
                        <a href={`/admin/catalog/categories/${cat.id}`} class="btn btn-sm btn-secondary">View</a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colspan="6" class="text-center py-4">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
