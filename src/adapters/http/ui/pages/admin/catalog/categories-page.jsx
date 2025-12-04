import { h } from 'preact';

export const CategoriesPage = ({ user, categories = [], nextCursor }) => {
  return (
    <div class="categories-page">
      <div class="page-header">
        <div>
          <h1>Categories</h1>
          <p class="text-muted">Manage product categories</p>
        </div>
        <button class="btn btn-primary" onclick="document.getElementById('create-category-dialog').showModal()">
          Add Category
        </button>
      </div>

      <div class="card p-0">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Parent ID</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map(cat => (
                  <tr>
                    <td>{cat.name}</td>
                    <td>{cat.description || '-'}</td>
                    <td><span class="badge badge-neutral">{cat.parentId || 'Root'}</span></td>
                    <td>{new Date(cat.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colspan="4" class="text-center py-4">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog id="create-category-dialog">
        <div class="modal-header">
          <h3>Create Category</h3>
          <button class="btn-close" onclick="document.getElementById('create-category-dialog').close()">×</button>
        </div>
        <form method="POST" action="/admin/categories">
          <div class="modal-body">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description"></textarea>
            </div>
            <div class="form-group">
              <label for="parentId">Parent Category (Optional)</label>
              <select id="parentId" name="parentId">
                <option value="">None (Root)</option>
                {categories.map(c => (
                  <option value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('create-category-dialog').close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create</button>
          </div>
        </form>
      </dialog>
    </div>
  );
};
