import { h } from 'preact';
import { adminNavigation, filterNavigationByRoles } from '../../shared/navigation/admin-nav.config.js';

export const AdminLayout = ({ children, user, currentPath }) => {
  // Use enriched roleNames from middleware, or fallback to empty array
  // If user has no roles, they see only public items (or none if everything restricted)
  // To avoid locking out the pilot user who might not have enriched roles yet if middleware fails,
  // we could fallback to 'admin' if roleIds are present but names missing?
  // No, better to rely on correct middleware behavior.
  // BUT, for development safety in this refactor, if roleNames is undefined,
  // we default to showing everything (legacy behavior) or defaulting to basic.
  // Given the "fix tech debt" request, we should rely on `user.roleNames`.

  const userRoles = user.roleNames || [];

  // Filter navigation
  const filteredNav = filterNavigationByRoles(adminNavigation, userRoles);

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
              {filteredNav.sections.map(section => (
                <div key={section.id} class={section.label ? 'nav-group' : ''}>
                  {section.label && (
                    <div class="nav-group-header">{section.label}</div>
                  )}
                  <div class="nav-group-items">
                    {section.items.map(item => {
                      // Note: Client-side JS below handles active state highlighting based on URL.
                      // We can also use `currentPath` prop for SSR active state if provided.
                      const isActive = currentPath === item.href;
                      return (
                        <a
                          key={item.id}
                          href={item.disabled ? '#' : item.href}
                          class={`nav-item ${item.disabled ? 'disabled' : ''} ${isActive ? 'active' : ''}`}
                        >
                          <span>{item.label}</span>
                          {/* Badge support would go here */}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
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
              // Exact match or sub-path match (optional)
              // For now, exact match or simple prefix if needed
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
