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
      <body>
        <div class="admin-layout">
          <aside class="admin-sidebar">
            <div class="sidebar-header">
              <h2>Admin Panel</h2>
            </div>
            <nav class="admin-nav">
              {/* General */}
              <a href="/admin/dashboard" class="nav-item">
                <span>Dashboard</span>
              </a>

              {/* Catalog */}
              <div class="nav-divider">Catalog</div>
              <a href="/admin/catalog" class="nav-item">
                <span>Products</span>
              </a>
              <span class="nav-item disabled">
                <span>Categories (F)</span>
              </span>
              <span class="nav-item disabled">
                <span>Price Lists (F)</span>
              </span>

              {/* Sales */}
              <div class="nav-divider">Sales</div>
              <a href="/admin/orders" class="nav-item">
                <span>Orders</span>
              </a>
              <span class="nav-item disabled">
                <span>Shipments (F)</span>
              </span>
              <span class="nav-item disabled">
                <span>Returns / RMAs (F)</span>
              </span>

              {/* Inventory */}
              <div class="nav-divider">Inventory</div>
              <a href="/admin/inventory" class="nav-item">
                <span>Stock Levels</span>
              </a>
              <a href="/admin/warehouses" class="nav-item">
                <span>Warehouses</span>
              </a>
              <a href="/admin/locations" class="nav-item">
                <span>Locations</span>
              </a>
              <span class="nav-item disabled">
                <span>Stock Movements (F)</span>
              </span>

              {/* Procurement */}
              <div class="nav-divider">Procurement</div>
              <a href="/admin/suppliers" class="nav-item">
                <span>Suppliers</span>
              </a>
              <a href="/admin/purchase-orders" class="nav-item">
                <span>Purchase Orders</span>
              </a>

              {/* Manufacturing */}
              <div class="nav-divider">Manufacturing</div>
              <a href="/admin/boms" class="nav-item">
                <span>Bill of Materials</span>
              </a>
              <a href="/admin/work-orders" class="nav-item">
                <span>Work Orders</span>
              </a>

              {/* CRM */}
              <div class="nav-divider">CRM</div>
              <a href="/admin/customers" class="nav-item">
                <span>Customers</span>
              </a>
              <span class="nav-item disabled">
                <span>Customer Groups (F)</span>
              </span>

              {/* Reports */}
              <div class="nav-divider">Reports</div>
              <span class="nav-item disabled">
                <span>Sales Report (F)</span>
              </span>
              <span class="nav-item disabled">
                <span>Inventory Valuation (F)</span>
              </span>

              {/* System */}
              <div class="nav-divider">System</div>
              <a href="/admin/users" class="nav-item">
                <span>Users</span>
              </a>
              <a href="/admin/roles" class="nav-item">
                <span>Roles</span>
              </a>
              <span class="nav-item disabled">
                <span>Settings (F)</span>
              </span>
              <span class="nav-item disabled">
                <span>Audit Log (F)</span>
              </span>
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
                <a href="/logout" class="btn btn-sm btn-secondary" style="margin-left: 1rem;">Logout</a>
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
