import { h } from 'preact';

export const CreateCategoryPage = ({ user, categories }) => {
  return (
    <div class="create-category-page">
      <div class="page-header">
        <h1>Create Category</h1>
      </div>

      <div class="card">
        <form method="POST" action="/admin/categories">
            <div class="form-group mb-4">
                <label>Name</label>
                <input type="text" name="name" required placeholder="Category Name" />
            </div>

            <div class="form-group mb-4">
                <label>Description</label>
                <textarea name="description" rows="3"></textarea>
            </div>

            <div class="form-group mb-4">
                <label>Parent Category</label>
                <select name="parentId">
                    <option value="">None (Root)</option>
                    {categories.map(c => (
                        <option value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div class="flex justify-end gap-2">
                <a href="/admin/categories" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary">Create Category</button>
            </div>
        </form>
      </div>
    </div>
  );
};
