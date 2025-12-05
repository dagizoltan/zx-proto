import { h } from 'preact';

export const CreateUserPage = ({ user, roles }) => {
  return (
    <div class="create-user-page">
      <div class="header-actions">
        <h1>New User</h1>
        <a href="/admin/users" class="btn-secondary">Cancel</a>
      </div>

      <div class="card">
        <form method="POST" action="/admin/users">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="name" required placeholder="John Doe" />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" name="email" required placeholder="john@example.com" />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" required minlength="8" placeholder="********" />
          </div>

          <div class="form-group">
            <label>Role</label>
            <select name="roleId">
              <option value="">Select Role (Optional)</option>
              {roles.map(role => (
                <option value={role.id}>{role.name}</option>
              ))}
            </select>
            <small class="text-muted">You can assign multiple roles later from the user list.</small>
          </div>

          <div class="form-actions" style="margin-top: 2rem;">
            <button type="submit" class="btn-primary">Create User</button>
          </div>
        </form>
      </div>
    </div>
  );
};
