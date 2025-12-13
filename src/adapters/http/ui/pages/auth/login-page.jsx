import { h } from 'preact';

export const LoginPage = ({ error, email }) => {
  return (
    <div class="login-page">
      <h2 class="text-center mb-6">Sign In</h2>

      {error && (
        <div class="toast toast-error mb-4">
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

        <button type="submit" class="btn btn-primary w-full">Sign In</button>
      </form>

      <div class="text-center mt-6 text-sm">
        <p>Don't have an account? <a href="/register">Sign up</a></p>
      </div>
    </div>
  );
};
