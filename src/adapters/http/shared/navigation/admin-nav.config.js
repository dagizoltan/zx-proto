/**
 * Centralized Navigation Configuration
 *
 * Benefits:
 * - Single source of truth
 * - Easy to add/remove/reorder items
 * - Role-based visibility
 * - Icon support
 * - Badge support (e.g., "5 pending")
 */

export const adminNavigation = {
  sections: [
    {
      id: 'overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/ims/dashboard',
          icon: 'LayoutDashboard',
          roles: ['admin', 'manager']
        }
      ]
    },

    {
      id: 'catalog',
      label: 'Catalog',
      items: [
        {
          id: 'products',
          label: 'Products',
          href: '/ims/catalog/products',
          icon: 'Package',
          roles: ['admin', 'manager', 'warehouse_staff']
        },
        {
          id: 'categories',
          label: 'Categories',
          href: '/ims/catalog/categories',
          icon: 'FolderTree',
          roles: ['admin', 'manager']
        },
        {
          id: 'price-lists',
          label: 'Price Lists',
          href: '/ims/catalog/price-lists',
          icon: 'DollarSign',
          roles: ['admin', 'manager']
        }
      ]
    },

    {
      id: 'sales',
      label: 'Sales',
      items: [
        {
          id: 'orders',
          label: 'Orders',
          href: '/ims/orders',
          icon: 'ShoppingCart',
          badge: 'pendingOrders', // Dynamic badge key
          roles: ['admin', 'manager', 'warehouse_staff']
        },
        {
          id: 'shipments',
          label: 'Shipments',
          href: '/ims/shipments',
          icon: 'Truck',
          roles: ['admin', 'manager', 'warehouse_staff']
        },
        {
          id: 'returns',
          label: 'Returns / RMAs',
          href: '/ims/returns',
          icon: 'RotateCcw',
          disabled: true,
          roles: ['admin', 'manager']
        }
      ]
    },

    {
      id: 'inventory',
      label: 'Inventory',
      items: [
        {
          id: 'stock-levels',
          label: 'Stock Levels',
          href: '/ims/inventory',
          icon: 'Archive',
          badge: 'lowStockCount',
          badgeVariant: 'warning',
          roles: ['admin', 'manager', 'warehouse_staff']
        },
        {
          id: 'warehouses',
          label: 'Warehouses',
          href: '/ims/inventory/warehouses',
          icon: 'Building',
          roles: ['admin', 'manager']
        },
        {
          id: 'locations',
          label: 'Locations',
          href: '/ims/inventory/locations',
          icon: 'MapPin',
          roles: ['admin', 'manager', 'warehouse_staff']
        },
        {
          id: 'movements',
          label: 'Stock Movements',
          href: '/ims/inventory/movements',
          icon: 'TrendingUp',
          disabled: true,
          roles: ['admin', 'manager']
        }
      ]
    },

    {
      id: 'procurement',
      label: 'Procurement',
      items: [
        {
          id: 'suppliers',
          label: 'Suppliers',
          href: '/ims/procurement/suppliers',
          icon: 'Users',
          roles: ['admin', 'manager']
        },
        {
          id: 'purchase-orders',
          label: 'Purchase Orders',
          href: '/ims/procurement/purchase-orders',
          icon: 'FileText',
          roles: ['admin', 'manager']
        }
      ]
    },

    {
      id: 'manufacturing',
      label: 'Manufacturing',
      items: [
        {
          id: 'boms',
          label: 'Bill of Materials',
          href: '/ims/manufacturing/boms',
          icon: 'Layers',
          roles: ['admin', 'manager']
        },
        {
          id: 'work-orders',
          label: 'Work Orders',
          href: '/ims/manufacturing/work-orders',
          icon: 'ClipboardList',
          roles: ['admin', 'manager', 'warehouse_staff']
        }
      ]
    },

    {
      id: 'crm',
      label: 'CRM',
      items: [
        {
          id: 'customers',
          label: 'Customers',
          href: '/ims/customers',
          icon: 'UserCircle',
          roles: ['admin', 'manager']
        },
        {
          id: 'customer-groups',
          label: 'Customer Groups',
          href: '/ims/crm/groups',
          icon: 'Users',
          disabled: true,
          roles: ['admin', 'manager']
        }
      ]
    },

    {
      id: 'reports',
      label: 'Reports',
      items: [
        {
          id: 'sales-report',
          label: 'Sales Report',
          href: '/ims/reports/sales',
          icon: 'BarChart',
          disabled: true,
          roles: ['admin', 'manager']
        },
        {
          id: 'inventory-valuation',
          label: 'Inventory Valuation',
          href: '/ims/reports/valuation',
          icon: 'DollarSign',
          disabled: true,
          roles: ['admin', 'manager']
        }
      ]
    },

    {
      id: 'system',
      label: 'System',
      items: [
        {
          id: 'users',
          label: 'Users',
          href: '/ims/system/users',
          icon: 'User',
          roles: ['admin']
        },
        {
          id: 'roles',
          label: 'Roles',
          href: '/ims/system/roles',
          icon: 'Shield',
          roles: ['admin']
        },
        {
          id: 'settings',
          label: 'Settings',
          href: '/ims/system/settings',
          icon: 'Settings',
          roles: ['admin']
        },
        {
          id: 'audit-log',
          label: 'Audit Log',
          href: '/ims/system/audit',
          icon: 'FileSearch',
          disabled: true,
          roles: ['admin']
        }
      ]
    },

    {
      id: 'actions',
      items: [
        {
          id: 'back-to-store',
          label: 'Back to Store',
          href: '/',
          icon: 'Store',
          roles: ['admin', 'manager', 'warehouse_staff', 'customer']
        }
      ]
    }
  ]
};

/**
 * Filter navigation based on user roles
 */
export const filterNavigationByRoles = (navigation, userRoles) => {
  return {
    ...navigation,
    sections: navigation.sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          if (!item.roles) return true;
          // If user has no roles and item requires roles, hide it
          if (!userRoles || userRoles.length === 0) return false;
          // Since userRoles are IDs (usually) but here we configured names ('admin', 'manager'),
          // we need to know how userRoles are structured.
          // The current `admin-layout.jsx` doesn't pass role names, it passes `user` object.
          // In `admin-routes.js`, we see `user.roleIds`. We'd need to resolve names or use IDs.
          // For now, assuming `userRoles` passed to this function are the *names* or we adjust logic.
          //
          // However, the existing `admin-layout.jsx` doesn't do role filtering on the client side rendering,
          // it just renders. The `AdminLayout` component receives `user`.
          // If `user.roleNames` is available, great. If not, we might need to rely on the backend to filter
          // or pass role names.
          //
          // Assumption: `userRoles` is an array of role names (e.g. ['admin']).
          return item.roles.some(role => userRoles.includes(role));
        })
      }))
      .filter(section => section.items.length > 0)
  };
};

/**
 * Get active item based on current path
 */
export const getActiveItem = (navigation, currentPath) => {
  for (const section of navigation.sections) {
    for (const item of section.items) {
      if (item.href === currentPath) {
        return { section, item };
      }
    }
  }
  return null;
};
