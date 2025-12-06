import { h } from 'preact';

export const CreateCustomerPage = ({ user }) => {
  return (
    <div class="create-customer-page">
      <div class="header-actions">
        <h1>New Customer</h1>
        <a href="/ims/customers" class="btn-secondary">Cancel</a>
      </div>

      <div class="card">
        <form method="POST" action="/ims/customers">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="name" required placeholder="Jane Doe" />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" name="email" required placeholder="jane@example.com" />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" required minlength="8" placeholder="********" />
          </div>

          <div class="alert alert-info" style="margin-top: 1rem;">
            This user will be created with the <strong>Customer</strong> role.
          </div>

          <div class="form-actions" style="margin-top: 2rem;">
            <button type="submit" class="btn-primary">Create Customer</button>
          </div>
        </form>
      </div>
    </div>
  );
};
