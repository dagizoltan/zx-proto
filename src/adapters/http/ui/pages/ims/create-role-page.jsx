import { h } from 'preact';

export const CreateRolePage = ({ user }) => {
  return (
    <div class="create-role-page">
      <div class="page-header">
        <h1>Create Role</h1>
      </div>

      <div class="card">
        <form method="POST" action="/ims/roles">
            <div class="form-group mb-4">
                <label>Role Name</label>
                <input type="text" name="name" required placeholder="e.g. Warehouse Manager" />
            </div>

            <div class="flex justify-end gap-2">
                <a href="/ims/roles" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary">Create Role</button>
            </div>
        </form>
      </div>
    </div>
  );
};
