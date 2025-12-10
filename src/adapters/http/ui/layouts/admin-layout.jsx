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
              <h2>zx ims</h2>
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
            <div class="sidebar-footer">
              <div class="user-info">
                <a href="/ims/me" class="user-link">
                  <span class="user-name" title={user.name}>{user.name || 'User'}</span>
                  <span class="user-email" title={user.email}>{user.email}</span>
                  <span class="user-role" title={(user.roleNames || []).join(', ')}>{(user.roleNames || []).join(', ') || 'No Roles'}</span>
                </a>
              </div>
              <a href="/logout" class="btn-logout">
                Logout
              </a>
            </div>
          </aside>

          <div class="admin-main">
            <header class="admin-header">
              <h1>IMS Shopfront Admin</h1>
            </header>

            <main class="admin-content">
              {children}
            </main>
          </div>

          <div id="toast-container"></div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
             // 0. SSE Notifications
             if (window.EventSource) {
               const evtSource = new EventSource('/api/system/notifications/stream');
               evtSource.onmessage = function(event) {
                 try {
                    // Skip ping
                    if (event.data.startsWith(':')) return;

                    const data = JSON.parse(event.data);
                    showToast(data);
                 } catch (e) {
                    console.error('SSE Error', e);
                 }
               };
             }

             function showToast(notification) {
                const container = document.getElementById('toast-container');
                const toast = document.createElement('div');
                toast.className = 'toast ' + notification.level;

                toast.innerHTML = \`
                  <div class="toast-content">
                    <div class="toast-title">\${notification.title || notification.level}</div>
                    <div class="toast-message">\${notification.message}</div>
                  </div>
                  <button class="toast-close">&times;</button>
                \`;

                // Close button logic
                toast.querySelector('.toast-close').onclick = () => toast.remove();

                container.appendChild(toast);

                // Auto dismiss Success/Info
                if (notification.level === 'SUCCESS' || notification.level === 'INFO') {
                  setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                  }, 5000);
                }
             }

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
