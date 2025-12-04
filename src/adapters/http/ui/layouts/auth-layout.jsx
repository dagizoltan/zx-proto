import { h } from 'preact';

export const AuthLayout = ({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Sign In - IMS Shopfront'}</title>
        <link rel="stylesheet" href="/static/css/styles.css" />
        <style>{`
          .auth-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: var(--background-color);
          }
          .auth-card {
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
          }
          .auth-logo {
            text-align: center;
            margin-bottom: 2rem;
            font-size: 1.5rem;
            font-weight: bold;
          }
          .auth-logo a {
            text-decoration: none;
            color: var(--primary-color);
          }
          .form-group {
            margin-bottom: 1rem;
          }
          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--secondary-color);
          }
          .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 0.25rem;
            box-sizing: border-box;
          }
          .auth-footer {
            margin-top: 1.5rem;
            text-align: center;
            font-size: 0.875rem;
          }
        `}</style>
      </head>
      <body>
        <div class="auth-container">
          <div class="auth-card">
            <div class="auth-logo">
              <a href="/">IMS Shopfront</a>
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
};
