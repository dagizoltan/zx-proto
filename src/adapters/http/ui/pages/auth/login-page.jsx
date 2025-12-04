import { h } from 'preact';

export const LoginPage = ({ error, email }) => {
  return (
    <div class="login-page">
      <h2 style="text-align: center; margin-bottom: 1.5rem;">Sign In</h2>

      {error && (
        <div class="toast toast-error" style="margin-bottom: 1rem;">
          {error}
        </div>
      )}

      <form action="/login" method="POST">
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
            autoComplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%;">Sign In</button>
      </form>

      <div class="auth-footer">
        <p>Don't have an account? <a href="/register">Sign up</a></p>
      </div>
    </div>
  );
};
