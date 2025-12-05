import { h } from 'preact';

export const CreateProductPage = ({ user, categories, priceLists }) => {
  return (
    <div class="create-product-page">
      <div class="page-header">
        <h1>Create Product</h1>
      </div>

      <div class="card">
        <form method="POST" action="/admin/products">
            <div class="form-group mb-4">
                <label>Name</label>
                <input type="text" name="name" required placeholder="Product Name" />
            </div>

            <div class="form-group mb-4">
                <label>SKU</label>
                <input type="text" name="sku" required placeholder="SKU-123" />
            </div>

            <div class="form-group mb-4">
                <label>Description</label>
                <textarea name="description" rows="3"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="form-group">
                    <label>Price</label>
                    <input type="number" step="0.01" name="price" required placeholder="0.00" />
                </div>
                <div class="form-group">
                    <label>Cost Price</label>
                    <input type="number" step="0.01" name="costPrice" placeholder="0.00" />
                </div>
            </div>

            <div class="form-group mb-4">
                <label>Category</label>
                <select name="categoryId">
                    <option value="">None</option>
                    {categories.map(c => <option value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div class="form-group mb-4">
                <label>Type</label>
                <select name="type">
                    <option value="SIMPLE">Simple</option>
                    <option value="CONFIGURABLE">Configurable</option>
                    <option value="VARIANT">Variant</option>
                </select>
            </div>

            <div class="flex justify-end gap-2">
                <a href="/admin/catalog" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary">Create Product</button>
            </div>
        </form>
      </div>
    </div>
  );
};
