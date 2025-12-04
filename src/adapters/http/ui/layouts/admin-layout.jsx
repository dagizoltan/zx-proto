import { h } from 'preact';

export const AdminLayout = ({ children, user }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Admin - IMS Shopfront</title>
        <link rel="stylesheet" href="/static/css/styles.css" />
        <link rel="stylesheet" href="/static/css/admin.css" />
      </head>
      <body class="admin-body">
        <div class="admin-layout">
          <aside class="admin-sidebar">
            <div class="sidebar-header">
              <h2>Admin Panel</h2>
            </div>
            <nav class="admin-nav">
              <a href="/admin/dashboard" class="nav-item">
                <span>Dashboard</span>
              </a>
              <a href="/admin/inventory" class="nav-item">
                <span>Inventory</span>
              </a>
              <a href="/admin/orders" class="nav-item">
                <span>Orders</span>
              </a>
              <a href="/" class="nav-item">
                <span>Back to Store</span>
              </a>
            </nav>
          </aside>

          <div class="admin-main">
            <header class="admin-header">
              <h1>IMS Shopfront Admin</h1>
              <div class="admin-user">
                <span>{user.name || user.email}</span>
                <a href="/logout" style="margin-left: 1rem; color: var(--primary-color);">Logout</a>
              </div>
            </header>

            <main class="admin-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
};
