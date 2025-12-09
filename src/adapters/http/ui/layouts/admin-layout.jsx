import { h } from 'preact';
import { adminNavigation, filterNavigationByRoles } from '../../shared/navigation/admin-nav.config.js';

export const AdminLayout = ({ children, user, currentPath, currentUrl, title }) => {
  const userRoles = user.roleNames || [];

  // Determine path robustly
  let activePath = currentPath;
  if (!activePath && currentUrl) {
      try {
          // Check if currentUrl is a full URL
          if (currentUrl.startsWith('http')) {
               activePath = new URL(currentUrl).pathname;
          } else {
               activePath = currentUrl;
          }
      } catch (e) {
          activePath = currentUrl;
      }
  }
  // Remove query params if they exist in path
  if (activePath && activePath.includes('?')) {
      activePath = activePath.split('?')[0];
  }

  // Filter navigation
  const filteredNav = filterNavigationByRoles(adminNavigation, userRoles);

  // Helper to find breadcrumb
  const findBreadcrumb = (path) => {
    if (!path) return null;

    // 1. Exact match in navigation
    for (const section of filteredNav.sections) {
      for (const item of section.items) {
        if (item.href === path) {
           return { section: section.label, item: item.label };
        }
      }
    }

    // 2. Sub-path matching
    let bestMatch = null;
    let maxLen = 0;

    for (const section of filteredNav.sections) {
      for (const item of section.items) {
        if (path.startsWith(item.href) && item.href.length > maxLen) {
           const href = item.href;
           if (path.length === href.length || path[href.length] === '/') {
               bestMatch = { section: section.label, item: item.label };
               maxLen = href.length;
           }
        }
      }
    }
    if (bestMatch) return bestMatch;

    return null;
  };

  const breadcrumbData = findBreadcrumb(activePath);

  // Clean Title
  const cleanTitle = (title || 'IMS Shopfront')
    .replace(/ - IMS Admin$/, '')
    .replace(/ - IMS Shopfront$/, '');

  let breadcrumbElement = null;
  if (breadcrumbData) {
      const sectionLabel = breadcrumbData.section || 'Admin';
      breadcrumbElement = (
         <nav class="breadcrumb" style="font-size: 0.85rem; color: #6c757d; margin-bottom: 0.25rem;">
             {sectionLabel} <span style="margin: 0 0.5rem;">/</span> {breadcrumbData.item}
         </nav>
      );
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'IMS Shopfront'}</title>
        <link rel="stylesheet" href="/static/css/styles.css" />
        <link rel="stylesheet" href="/static/css/admin.css" />
      </head>
      <body>
        <div class="admin-layout">
          <aside class="admin-sidebar">
            <div class="sidebar-header">
              <h2>ZX IMS</h2>
            </div>
            <nav class="admin-nav" id="admin-nav">
              {filteredNav.sections.map(section => (
                <div key={section.id} class={section.label ? 'nav-group' : ''}>
                  {section.label && (
                    <div class="nav-group-header">{section.label}</div>
                  )}
                  <div class="nav-group-items">
                    {section.items.map(item => {
                      const isActive = activePath === item.href;
                      return (
                        <a
                          key={item.id}
                          href={item.disabled ? '#' : item.href}
                          class={`nav-item ${item.disabled ? 'disabled' : ''} ${isActive ? 'active' : ''}`}
                        >
                          <span>{item.label}</span>
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
              <div class="header-title-group">
                  {breadcrumbElement}
                  <h1 style="margin: 0; font-size: 1.5rem; line-height: 1.2;">{cleanTitle}</h1>
              </div>
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
