import { h } from 'preact';

export const RegisterPage = ({ error, email, name }) => {
  return (
    <div class="register-page">
      <h2 class="text-center mb-6">Create Account</h2>

      {error && (
        <div class="toast toast-error mb-4">
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

        <button type="submit" class="btn btn-primary w-full">Sign Up</button>
      </form>

      <div class="text-center mt-6 text-sm">
        <p>Already have an account? <a href="/login">Sign in</a></p>
      </div>
    </div>
  );
};
