import { h } from 'preact';

export const MainLayout = ({ children, user, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="/static/css/styles.css" />
      </head>
      <body>
        <header class="main-header">
          <div class="container">
            <div class="logo">
              <a href="/">IMS Shopfront</a>
            </div>

            <nav class="main-nav">
              <a href="/">Home</a>
              <a href="/products">Products</a>
              {user && <a href="/orders">My Orders</a>}
              {user?.roles?.includes('admin') && <a href="/admin/dashboard">Admin</a>}
            </nav>

            <div class="header-actions">
              {user ? (
                <>
                  <span class="user-name">{user.name || user.email}</span>
                  <a href="/logout" class="btn btn-secondary">Logout</a>
                </>
              ) : (
                <>
                  <a href="/login" class="btn btn-secondary">Sign In</a>
                  <a href="/register" class="btn btn-primary">Sign Up</a>
                </>
              )}
            </div>
          </div>
        </header>

        <main class="main-content">
          <div class="container">
            {children}
          </div>
        </main>

        <footer class="main-footer">
          <div class="container">
            <p>&copy; 2024 IMS Shopfront. All rights reserved.</p>
          </div>
        </footer>

         {/* Realtime notifications island placeholder - to be hydrated */}
         {user && (
           <div
             id="notifications-island"
             data-user-id={user.id}
           />
         )}
      </body>
    </html>
  );
};
