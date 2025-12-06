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
            <nav class="admin-nav" id="admin-nav">
              {/* General - Top Level */}
              <a href="/ims/dashboard" class="nav-item">
                <span>Dashboard</span>
              </a>

              {/* Catalog Group */}
              <div class="nav-group">
                <div class="nav-group-header">Catalog</div>
                <div class="nav-group-items">
                  <a href="/ims/catalog" class="nav-item">
                    <span>Products</span>
                  </a>
                  <a href="/ims/catalog/categories" class="nav-item">
                    <span>Categories</span>
                  </a>
                  <a href="/ims/catalog/price-lists" class="nav-item">
                    <span>Price Lists</span>
                  </a>
                </div>
              </div>

              {/* Sales Group */}
              <div class="nav-group">
                <div class="nav-group-header">Sales</div>
                <div class="nav-group-items">
                  <a href="/ims/orders" class="nav-item">
                    <span>Orders</span>
                  </a>
                  <a href="/ims/shipments" class="nav-item">
                    <span>Shipments</span>
                  </a>
                  <span class="nav-item disabled">
                    <span>Returns / RMAs (F)</span>
                  </span>
                </div>
              </div>

              {/* Inventory Group */}
              <div class="nav-group">
                <div class="nav-group-header">Inventory</div>
                <div class="nav-group-items">
                  <a href="/ims/inventory" class="nav-item">
                    <span>Stock Levels</span>
                  </a>
                  <a href="/ims/inventory/warehouses" class="nav-item">
                    <span>Warehouses</span>
                  </a>
                  <a href="/ims/inventory/locations" class="nav-item">
                    <span>Locations</span>
                  </a>
                  <span class="nav-item disabled">
                    <span>Stock Movements (F)</span>
                  </span>
                </div>
              </div>

              {/* Procurement Group */}
              <div class="nav-group">
                <div class="nav-group-header">Procurement</div>
                <div class="nav-group-items">
                  <a href="/ims/procurement/suppliers" class="nav-item">
                    <span>Suppliers</span>
                  </a>
                  <a href="/ims/procurement/purchase-orders" class="nav-item">
                    <span>Purchase Orders</span>
                  </a>
                </div>
              </div>

              {/* Manufacturing Group */}
              <div class="nav-group">
                <div class="nav-group-header">Manufacturing</div>
                <div class="nav-group-items">
                  <a href="/ims/manufacturing/boms" class="nav-item">
                    <span>Bill of Materials</span>
                  </a>
                  <a href="/ims/manufacturing/work-orders" class="nav-item">
                    <span>Work Orders</span>
                  </a>
                </div>
              </div>

              {/* CRM Group */}
              <div class="nav-group">
                <div class="nav-group-header">CRM</div>
                <div class="nav-group-items">
                  <a href="/ims/customers" class="nav-item">
                    <span>Customers</span>
                  </a>
                  <span class="nav-item disabled">
                    <span>Customer Groups (F)</span>
                  </span>
                </div>
              </div>

              {/* Reports Group */}
              <div class="nav-group">
                <div class="nav-group-header">Reports</div>
                <div class="nav-group-items">
                  <span class="nav-item disabled">
                    <span>Sales Report (F)</span>
                  </span>
                  <span class="nav-item disabled">
                    <span>Inventory Valuation (F)</span>
                  </span>
                </div>
              </div>

              {/* System Group */}
              <div class="nav-group">
                <div class="nav-group-header">System</div>
                <div class="nav-group-items">
                  <a href="/ims/users" class="nav-item">
                    <span>Users</span>
                  </a>
                  <a href="/ims/roles" class="nav-item">
                    <span>Roles</span>
                  </a>
                  <a href="/ims/settings" class="nav-item">
                    <span>Settings</span>
                  </a>
                  <span class="nav-item disabled">
                    <span>Audit Log (F)</span>
                  </span>
                </div>
              </div>

              {/* Back to Store - Top Level */}
              <a href="/" class="nav-item">
                <span>Back to Store</span>
              </a>
            </nav>
          </aside>

          <div class="admin-main">
            <header class="admin-header">
              <h1>IMS Shopfront Admin</h1>
              <div class="admin-user">
                <a href="/ims/me" class="mr-2" style="color: inherit; text-decoration: none;">
                    <span>{user.name || user.email}</span>
                </a>
                <a href="/logout" class="btn btn-sm btn-secondary" style="margin-left: 1rem;">Logout</a>
              </div>
            </header>

            <main class="admin-content">
              {children}
            </main>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // 1. Highlight active link and open its group
            const currentPath = window.location.pathname;
            const navItems = document.querySelectorAll('.nav-item');

            navItems.forEach(item => {
              if (item.getAttribute('href') === currentPath) {
                item.classList.add('active');
                const group = item.closest('.nav-group');
                if (group) {
                  group.classList.add('open');
                }
              }
            });

            // 2. Accordion Logic
            const headers = document.querySelectorAll('.nav-group-header');
            headers.forEach(header => {
              header.addEventListener('click', () => {
                const group = header.parentElement;
                const isOpen = group.classList.contains('open');

                // Close all groups
                document.querySelectorAll('.nav-group').forEach(g => {
                  g.classList.remove('open');
                });

                // If it was not open, open it (toggle)
                if (!isOpen) {
                  group.classList.add('open');
                }
              });
            });
          })();
        ` }} />
      </body>
    </html>
  );
};
