import { h } from 'preact';

export const RegisterPage = ({ error, email, name }) => {
  return (
    <div class="register-page">
      <h2 style="text-align: center; margin-bottom: 1.5rem;">Create Account</h2>

      {error && (
        <div class="toast toast-error" style="margin-bottom: 1rem;">
          {error}
        </div>
      )}

      <form action="/register" method="POST">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            required
            autoComplete="name"
          />
        </div>

        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            required
            autoComplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%;">Sign Up</button>
      </form>

      <div class="auth-footer">
        <p>Already have an account? <a href="/login">Sign in</a></p>
      </div>
    </div>
  );
};
