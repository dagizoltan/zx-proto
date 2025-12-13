import { h } from 'preact';

export const AuthLayout = ({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Sign In - zx ims'}</title>
        <link rel="stylesheet" href="/static/css/styles.css" />
      </head>
      <body>
        <div class="auth-container">
          <div class="card" style="width: 100%; max-width: 400px;">
            <div class="auth-logo">
              <a href="/" class="brand-text">zx ims</a>
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
};
